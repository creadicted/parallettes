import { useEffect, useState } from 'react'
import type { Player } from '../app'

interface Props {
  players: Player[]
  onPlayersChange: () => void
  onBack: () => void
}

const SWATCHES = [
  '#3eb8ff', '#ff6b9d', '#e8ff3e', '#ff6b35',
  '#a78bfa', '#2dd4bf', '#ef4444', '#4ade80',
  '#fbbf24', '#fb923c',
]

type Fields = { name: string; color: string; initials: string }

export default function SettingsTab({ players, onPlayersChange, onBack }: Props) {
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<Record<number, Fields>>({})

  useEffect(() => {
    if (players.length > 0) {
      setFields(Object.fromEntries(players.map(p => [p.id, { name: p.name, color: p.color, initials: p.initials }])))
    }
  }, [players])

  const update = (id: number, key: keyof Fields, value: string) => {
    setFields(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      await Promise.all(
        players.map(p => {
          const f = fields[p.id]
          if (!f) return Promise.resolve()
          return fetch(`/api/players/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f),
          })
        })
      )
      onPlayersChange()
    } finally {
      setSaving(false)
    }
  }

  const downloadDB = () => {
    if (!confirm('Datenbank-Backup herunterladen?')) return
    window.location.href = '/api/db/export'
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <div className="s-title">EINSTELLUNGEN</div>

      <div className="settings-players">
        {players.map(p => {
          const f = fields[p.id] ?? { name: p.name, color: p.color, initials: p.initials }
          return (
            <div className="settings-player-card" key={p.id}>
              <div className="settings-player-preview" style={{ background: `${f.color}22`, borderColor: f.color }}>
                <span className="settings-player-avatar" style={{ background: f.color, color: '#000' }}>
                  {f.initials || '?'}
                </span>
                <span className="settings-player-name-preview">{f.name || 'Player'}</span>
              </div>

              <div className="settings-field">
                <label className="settings-label">Name</label>
                <input
                  className="log-input"
                  value={f.name}
                  onChange={e => update(p.id, 'name', e.target.value)}
                  placeholder="Name"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">Kürzel</label>
                <input
                  className="log-input"
                  value={f.initials}
                  onChange={e => update(p.id, 'initials', e.target.value.slice(0, 3))}
                  placeholder="AB"
                  maxLength={3}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">Farbe</label>
                <div className="swatch-grid">
                  {SWATCHES.map(c => (
                    <button
                      key={c}
                      className={`swatch${f.color === c ? ' selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => update(p.id, 'color', c)}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="log-btn"
        style={{ width: '100%', marginBottom: 24 }}
        onClick={saveAll}
        disabled={saving}
      >
        {saving ? 'Wird gespeichert…' : 'Speichern'}
      </button>

      <div className="settings-section">
        <div className="settings-section-title">Daten</div>
        <button className="log-btn secondary" style={{ width: '100%' }} onClick={downloadDB}>
          ↓ Datenbank-Backup herunterladen
        </button>
      </div>
    </>
  )
}
