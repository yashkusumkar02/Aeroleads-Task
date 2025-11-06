import React, { useEffect, useMemo, useState } from 'react'
import ProfileCard, { Profile } from './components/ProfileCard'

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
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
    load()
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

  return (
    <div className="container">
      <header>
        <h1>LinkedIn Profiles</h1>
        <div className="subheader">
          <span>Total: {profiles.length}</span>
          <input
            placeholder="Search by name or headline"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

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


