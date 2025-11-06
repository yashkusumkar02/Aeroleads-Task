import React, { useEffect, useRef, useState } from 'react';

interface JobUpdate {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  current: number;
  total: number;
  progress: number;
  logs: string[];
  lastLog: string;
  errorMessage?: string;
}

interface ScrapePanelProps {
  jobId: string;
  sseUrl: string;
  onDone: () => void;
  onClose: () => void;
}

const ScrapePanel: React.FC<ScrapePanelProps> = ({ jobId, sseUrl, onDone, onClose }) => {
  const [job, setJob] = useState<JobUpdate | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('tick', (e) => {
      try {
        const data = JSON.parse(e.data);
        setJob(data);
        if (data.status === 'done') {
          setTimeout(() => {
            onDone();
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      // Fallback to polling if SSE fails
      if (eventSource.readyState === EventSource.CLOSED) {
        pollJobStatus();
      }
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseUrl]);

  const pollJobStatus = async () => {
    const base = import.meta.env.VITE_API_BASE || '';
    try {
      const res = await fetch(`${base}/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        if (data.status === 'done') {
          onDone();
        } else if (data.status !== 'error') {
          setTimeout(pollJobStatus, 2000);
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [job?.logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'running':
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  };

  const getLogLevel = (log: string) => {
    const lower = log.toLowerCase();
    if (lower.includes('error') || lower.includes('failed')) return 'error';
    if (lower.includes('success') || lower.includes('done')) return 'success';
    return 'info';
  };

  const logs = job?.logs || [];
  const displayLogs = logs.slice(-100);

  return (
    <div className="scrape-panel">
      <div className="panel-header">
        <h2>Scraping Status</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="panel-content">
        {job && (
          <>
            <div className="status-bar">
              <div className="status-indicator" style={{ color: getStatusColor(job.status) }}>
                <span className="status-dot" style={{ backgroundColor: getStatusColor(job.status) }}></span>
                {job.status === 'queued' && 'Queued'}
                {job.status === 'running' && 'Running...'}
                {job.status === 'done' && 'Complete!'}
                {job.status === 'error' && 'Error'}
              </div>
              <div className="progress-info">
                {job.current} / {job.total} profiles
              </div>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${job.progress}%`,
                  backgroundColor: getStatusColor(job.status),
                }}
              />
            </div>

            {job.status === 'done' && (
              <div className="success-message">
                ✓ Scraping completed successfully! Refreshing profiles...
              </div>
            )}

            {job.status === 'error' && job.errorMessage && (
              <div className="error-message">Error: {job.errorMessage}</div>
            )}

            <div className="step-badges">
              <div className={`badge ${job.status !== 'queued' ? 'active' : ''}`}>
                {job.status !== 'queued' ? '✓' : '○'} Login
              </div>
              <div className={`badge ${job.current > 0 ? 'active' : ''}`}>
                {job.current > 0 ? '✓' : '○'} Navigate
              </div>
              <div className={`badge ${job.current > 0 ? 'active' : ''}`}>
                {job.current > 0 ? '✓' : '○'} Extract
              </div>
              <div className={`badge ${job.current > 0 ? 'active' : ''}`}>
                {job.current > 0 ? '✓' : '○'} Save
              </div>
              <div className={`badge ${job.status === 'done' ? 'active' : ''}`}>
                {job.status === 'done' ? '✓' : '○'} Upload
              </div>
              <div className={`badge ${job.status === 'done' ? 'active' : ''}`}>
                {job.status === 'done' ? '✓' : '○'} Done
              </div>
            </div>

            <div className="logs-section">
              <h3>Live Logs</h3>
              <div className="logs-container">
                {displayLogs.length === 0 ? (
                  <div className="log-line info">Waiting for logs...</div>
                ) : (
                  displayLogs.map((log, idx) => {
                    const level = getLogLevel(log);
                    return (
                      <div key={idx} className={`log-line ${level}`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </>
        )}

        {!job && <div className="loading">Connecting to job stream...</div>}
      </div>
    </div>
  );
};

export default ScrapePanel;

