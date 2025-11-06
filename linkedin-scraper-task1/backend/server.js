import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csvtojson';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const BACKEND_BASE = process.env.BACKEND_BASE || `http://localhost:${PORT}`;
const SCRAPER_WORKER_URL = process.env.SCRAPER_WORKER_URL || 'http://localhost:8000';
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../scraper');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add disclaimer header middleware
app.use((req, res, next) => {
  res.setHeader('X-Disclaimer', 'For demo purposes only. Use test/public profiles. Credentials not stored.');
  next();
});

// CORS: allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev
      }
    },
    credentials: true,
  })
);

// Serve images from data dir
const imagesDir = path.resolve(DATA_DIR, 'images');
fs.mkdirSync(imagesDir, { recursive: true });
app.use('/images', express.static(imagesDir));

// Job system (in-memory)
const jobs = new Map();

function createJob(total) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const job = {
    id,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    logs: [],
    total,
    current: 0,
    sseClients: new Set(),
  };
  jobs.set(id, job);
  return job;
}

function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return;
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  // Broadcast to all SSE clients
  const message = JSON.stringify({
    jobId,
    ...updates,
    status: job.status,
    current: job.current,
    total: job.total,
    progress: job.total > 0 ? Math.round((job.current / job.total) * 100) : 0,
    lastLog: job.logs[job.logs.length - 1] || '',
  });
  job.sseClients.forEach((client) => {
    try {
      client.write(`event: tick\n`);
      client.write(`data: ${message}\n\n`);
    } catch (e) {
      // Client disconnected
      job.sseClients.delete(client);
    }
  });
}

function addJobLog(jobId, message) {
  const job = jobs.get(jobId);
  if (!job) return;
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  job.logs.push(logLine);
  // Keep last 500 lines
  if (job.logs.length > 500) {
    job.logs = job.logs.slice(-500);
  }
  updateJob(jobId, {});
}

// Rate limiting (simple token bucket)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before starting another scrape.',
    });
  }

  record.count++;
  rateLimitMap.set(ip, record);
  next();
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Get profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || ''), 10);
    const csvPath = path.resolve(DATA_DIR, 'profiles.csv');
    const exists = fs.existsSync(csvPath);
    if (!exists) {
      return res.status(500).json({ error: 'profiles.csv not found. Run the scraper first.' });
    }
    const data = await csv({ trim: true }).fromFile(csvPath);
    const rows = Number.isFinite(limit) && limit > 0 ? data.slice(0, limit) : data;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed reading profiles.csv', details: String(err) });
  }
});

// Start scrape
app.post('/api/start-scrape', rateLimitMiddleware, async (req, res) => {
  try {
    const { email, password, urls } = req.body;

    // Validation
    if (!email || !password || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Missing email, password, or urls array' });
    }

    if (urls.length === 0 || urls.length > 20) {
      return res.status(400).json({ error: 'URLs array must contain 1-20 URLs' });
    }

    // Validate URLs are LinkedIn URLs
    const validUrls = urls.filter((url) => {
      const trimmed = String(url).trim();
      return trimmed && (trimmed.includes('linkedin.com/in/') || trimmed.includes('linkedin.com/company/'));
    });

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'No valid LinkedIn URLs found' });
    }

    // Create job
    const job = createJob(validUrls.length);
    addJobLog(job.id, 'Job created and queued');

    // Forward to Scraper Worker
    try {
      const workerPayload = {
        jobId: job.id,
        email,
        password,
        urls: validUrls,
        webhook: `${BACKEND_BASE}/api/scrape-webhook`,
      };

      // Don't await - let it run async
      fetch(`${SCRAPER_WORKER_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerPayload),
      }).catch((err) => {
        addJobLog(job.id, `Failed to contact worker: ${err.message}`);
        updateJob(job.id, { status: 'error', errorMessage: 'Failed to start worker' });
      });

      addJobLog(job.id, 'Request forwarded to scraper worker');
      updateJob(job.id, { status: 'running' });
    } catch (err) {
      addJobLog(job.id, `Error starting worker: ${err.message}`);
      updateJob(job.id, { status: 'error', errorMessage: String(err) });
    }

    res.json({
      jobId: job.id,
      sseUrl: `${BACKEND_BASE}/api/jobs/${job.id}/sse`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start scrape', details: String(err) });
  }
});

// SSE endpoint
app.get('/api/jobs/:jobId/sse', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Add client to job
  job.sseClients.add(res);

  // Send initial state
  const initial = JSON.stringify({
    jobId,
    status: job.status,
    current: job.current,
    total: job.total,
    progress: job.total > 0 ? Math.round((job.current / job.total) * 100) : 0,
    logs: job.logs.slice(-100), // Last 100 logs
  });
  res.write(`event: tick\n`);
  res.write(`data: ${initial}\n\n`);

  // Cleanup on disconnect
  req.on('close', () => {
    job.sseClients.delete(res);
    res.end();
  });
});

// Webhook from worker
app.post('/api/scrape-webhook', (req, res) => {
  const { jobId, event, message, current, total, csvPath, imagesDir, error } = req.body;

  if (!jobId || !event) {
    return res.status(400).json({ error: 'Missing jobId or event' });
  }

  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Never log passwords in messages
  const safeMessage = message ? String(message).replace(/password[=:]\s*\S+/gi, 'password=***') : '';

  if (safeMessage) {
    addJobLog(jobId, safeMessage);
  }

  if (event === 'browser-started') {
    updateJob(jobId, { status: 'running' });
  } else if (event === 'login-success') {
    addJobLog(jobId, 'Login successful');
  } else if (event === 'login-error') {
    updateJob(jobId, { status: 'error', errorMessage: error || 'Login failed' });
  } else if (event === 'scraping') {
    updateJob(jobId, { current: current || job.current });
  } else if (event === 'rate-limited') {
    addJobLog(jobId, 'Rate limited by LinkedIn - waiting...');
  } else if (event === 'done') {
    updateJob(jobId, {
      status: 'done',
      current: total || job.total,
      resultPath: csvPath,
      imagesDir: imagesDir,
    });
  } else if (event === 'error') {
    updateJob(jobId, { status: 'error', errorMessage: error || 'Unknown error' });
  }

  res.json({ ok: true });
});

// File upload endpoints
const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

// Upload CSV
app.post('/api/upload/csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const destPath = path.resolve(DATA_DIR, 'profiles.csv');
  fs.renameSync(req.file.path, destPath);

  res.json({ ok: true, path: destPath });
});

// Upload image
app.post('/api/upload/image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const name = req.query.name || req.file.originalname || `profile_${Date.now()}.jpg`;
  const destPath = path.resolve(imagesDir, name);
  fs.renameSync(req.file.path, destPath);

  res.json({ ok: true, path: destPath, name });
});

// Get job status (polling fallback)
app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    current: job.current,
    total: job.total,
    progress: job.total > 0 ? Math.round((job.current / job.total) * 100) : 0,
    logs: job.logs.slice(-100),
    errorMessage: job.errorMessage,
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`Scraper Worker URL: ${SCRAPER_WORKER_URL}`);
  console.log(`Data directory: ${DATA_DIR}`);
});


