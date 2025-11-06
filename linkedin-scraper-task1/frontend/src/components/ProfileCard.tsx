import React, { useMemo, useState } from 'react'

export interface ExperienceItem {
  title?: string
  company?: string
  date_range?: string
  description?: string
}

export interface EducationItem {
  school?: string
  degree?: string
  year?: string
}

export interface ProjectItem {
  title?: string
  description?: string
}

export interface Profile {
  url: string
  name?: string
  headline?: string
  location?: string
  about?: string
  image_file?: string
  experiences_json?: string
  education_json?: string
  projects_json?: string
  skills_csv?: string
}

function parseJsonArray<T>(raw?: string): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [expandedAbout, setExpandedAbout] = useState(false)

  const experiences = useMemo(
    () => parseJsonArray<ExperienceItem>(profile.experiences_json),
    [profile.experiences_json]
  )
  const education = useMemo(
    () => parseJsonArray<EducationItem>(profile.education_json),
    [profile.education_json]
  )
  const projects = useMemo(
    () => parseJsonArray<ProjectItem>(profile.projects_json),
    [profile.projects_json]
  )

  const skills = useMemo(() => {
    const s = (profile.skills_csv || '').split(',').map((t) => t.trim()).filter(Boolean)
    return s.slice(0, 10)
  }, [profile.skills_csv])

  const about = profile.about || ''
  const aboutShort = about.length > 300 && !expandedAbout ? about.slice(0, 300) + '…' : about

  // Always use a static placeholder/logo instead of scraped images
  const imageSrc = '/placeholder.jpg'

  return (
    <article className="card">
      <div className="card-header">
        <img
          className="avatar"
          src={imageSrc}
          alt={profile.name || 'Avatar'}
          onError={(e) => ((e.currentTarget.src = '/placeholder.jpg'))}
        />
        <div>
          <h2>{profile.name || 'Unknown'}</h2>
          <div className="muted">{profile.headline || '—'}</div>
          <div className="muted small">{profile.location || ''}</div>
        </div>
      </div>

      {about && (
        <div className="about">
          <p>{aboutShort}</p>
          {about.length > 300 && (
            <button className="link" onClick={() => setExpandedAbout((v) => !v)}>
              {expandedAbout ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {skills.length > 0 && (
        <div className="skills">
          {skills.map((s, i) => (
            <span key={i} className="chip">{s}</span>
          ))}
        </div>
      )}

      {experiences.length > 0 && (
        <details className="section">
          <summary>Experience</summary>
          <ul>
            {experiences.map((ex, i) => (
              <li key={i}>
                <div className="title">{ex.title || '—'}</div>
                <div className="muted">{ex.company || ''}</div>
                <div className="muted small">{ex.date_range || ''}</div>
                {ex.description && <p>{ex.description}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {education.length > 0 && (
        <details className="section">
          <summary>Education</summary>
          <ul>
            {education.map((ed, i) => (
              <li key={i}>
                <div className="title">{ed.school || '—'}</div>
                <div className="muted">{ed.degree || ''}</div>
                <div className="muted small">{ed.year || ''}</div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {projects.length > 0 && (
        <details className="section">
          <summary>Projects</summary>
          <ul>
            {projects.map((pr, i) => (
              <li key={i}>
                <div className="title">{pr.title || '—'}</div>
                {pr.description && <p>{pr.description}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {profile.url && (
        <div className="actions">
          <a className="button" href={profile.url} target="_blank" rel="noreferrer">Open on LinkedIn</a>
        </div>
      )}
    </article>
  )
}

export default ProfileCard


