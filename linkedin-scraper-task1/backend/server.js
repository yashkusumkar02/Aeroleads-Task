import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csvtojson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../scraper');

// CORS: allow only frontend dev origin
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve images from data dir
const imagesDir = path.resolve(DATA_DIR, 'images');
app.use('/images', express.static(imagesDir));

app.get('/api/profiles', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || ''), 10);
    const csvPath = path.resolve(DATA_DIR, 'profiles.csv');
    const exists = await import('fs').then(({ default: fs }) => fs.existsSync(csvPath));
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

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


