import React, { useEffect, useMemo, useState } from 'react'
import ProfileCard, { Profile } from './components/ProfileCard'
import ScrapePanel from './components/ScrapePanel'

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState('')
  const [showScrapeForm, setShowScrapeForm] = useState(false)
  const [scrapeJob, setScrapeJob] = useState<{ jobId: string; sseUrl: string } | null>(null)
  const [scrapeForm, setScrapeForm] = useState({ email: '', password: '', urls: '' })
  const [formErrors, setFormErrors] = useState<string[]>([])

  const loadProfiles = async () => {
    setState('loading')
    try {
      const base = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${base}/api/profiles`)
      if (!res.ok) throw new Error('Failed to load profiles')
      const data = await res.json()
      setProfiles(data)
      setState('success')
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
      setState('error')
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) =>
      [p.name, p.headline]
        .map((s) => (s || '').toLowerCase())
        .some((s) => s.includes(q))
    )
  }, [profiles, query])

  const validateForm = (): boolean => {
    const errors: string[] = []
    if (!scrapeForm.email.trim()) {
      errors.push('Email is required')
    }
    if (!scrapeForm.password.trim()) {
      errors.push('Password is required')
    }
    const urlLines = scrapeForm.urls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
    if (urlLines.length === 0) {
      errors.push('At least one LinkedIn URL is required')
    } else if (urlLines.length > 20) {
      errors.push('Maximum 20 URLs allowed')
    }
    // Validate URLs
    const invalidUrls = urlLines.filter(
      (url) => !url.includes('linkedin.com/in/') && !url.includes('linkedin.com/company/')
    )
    if (invalidUrls.length > 0) {
      errors.push(`Invalid LinkedIn URLs found: ${invalidUrls.slice(0, 3).join(', ')}`)
    }
    setFormErrors(errors)
    return errors.length === 0
  }

  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const urlLines = scrapeForm.urls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))

    try {
      const base = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${base}/api/start-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: scrapeForm.email.trim(),
          password: scrapeForm.password,
          urls: urlLines,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start scrape')
      }

      const data = await res.json()
      setScrapeJob({ jobId: data.jobId, sseUrl: data.sseUrl })
      setShowScrapeForm(false)
    } catch (err: any) {
      setFormErrors([err.message || 'Failed to start scrape'])
    }
  }

  const handleScrapeDone = () => {
    setScrapeJob(null)
    loadProfiles()
    // Clear form
    setScrapeForm({ email: '', password: '', urls: '' })
  }

  return (
    <div className="container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1>LinkedIn Profiles</h1>
          <button className="button primary" onClick={() => setShowScrapeForm(true)}>
            Start Scrape
          </button>
        </div>
        <div className="subheader">
          <span>Total: {profiles.length}</span>
          <input
            placeholder="Search by name or headline"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="disclaimer-banner">
        For demo purposes; use test/public profiles only. We do not store your LinkedIn credentials.
      </div>

      {showScrapeForm && (
        <div className="modal-overlay" onClick={() => setShowScrapeForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start LinkedIn Scrape</h2>
              <button className="close-btn" onClick={() => setShowScrapeForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleStartScrape} className="scrape-form">
              <div className="form-group">
                <label htmlFor="email">LinkedIn Email</label>
                <input
                  id="email"
                  type="email"
                  value={scrapeForm.email}
                  onChange={(e) => setScrapeForm({ ...scrapeForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
                <small className="form-note">Credentials are held in memory for this run only.</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">LinkedIn Password</label>
                <input
                  id="password"
                  type="password"
                  value={scrapeForm.password}
                  onChange={(e) => setScrapeForm({ ...scrapeForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="urls">Profile URLs (one per line, max 20)</label>
                <textarea
                  id="urls"
                  value={scrapeForm.urls}
                  onChange={(e) => setScrapeForm({ ...scrapeForm, urls: e.target.value })}
                  placeholder="https://linkedin.com/in/example1&#10;https://linkedin.com/in/example2"
                  rows={8}
                  required
                />
                <small className="form-note">
                  Enter LinkedIn profile URLs (linkedin.com/in/...). Lines starting with # are ignored.
                </small>
              </div>

              {formErrors.length > 0 && (
                <div className="form-errors">
                  {formErrors.map((err, idx) => (
                    <div key={idx} className="error">{err}</div>
                  ))}
                </div>
              )}

              <div className="form-warning">
                <strong>⚠️ Warning:</strong> This tool is for demo purposes. Use a test account or public profiles only.
                Respect LinkedIn's Terms of Service.
              </div>

              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setShowScrapeForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  Start Scrape
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scrapeJob && (
        <ScrapePanel
          jobId={scrapeJob.jobId}
          sseUrl={scrapeJob.sseUrl}
          onDone={handleScrapeDone}
          onClose={() => setScrapeJob(null)}
        />
      )}

      {state === 'loading' && <p>Loading profiles…</p>}
      {state === 'error' && <p className="error">{error}</p>}
      {state === 'success' && filtered.length === 0 && <p>No profiles found.</p>}

      {state === 'success' && (
        <div className="grid">
          {filtered.map((p, idx) => (
            <ProfileCard key={p.url || idx} profile={p} />)
          )}
        </div>
      )}
    </div>
  )
}

export default App


