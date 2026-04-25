import { useEffect, useState } from 'react'
import type { Player, Challenge, ChallengeRun } from '../app'

interface Props {
  players: Player[]
  activeRun: ChallengeRun | null
  onRunChange: () => void
}

export default function ChallengesTab({ players, activeRun, onRunChange }: Props) {
  const p1 = players.find(p => p.id === 1)
  const p2 = players.find(p => p.id === 2)

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [startingId, setStartingId] = useState<number | null>(null)
  const [startDays, setStartDays] = useState(28)

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then((data: Challenge[]) => { if (Array.isArray(data)) setChallenges(data) })
      .catch(console.error)
  }, [])

  const openStart = (c: Challenge) => {
    setStartingId(c.id)
    setStartDays(c.durationDays)
  }

  const doStart = async (challengeId: number) => {
    const res = await fetch('/api/challenges/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, durationDays: startDays }),
    })
    if (res.ok) {
      setStartingId(null)
      onRunChange()
    }
  }

  const doComplete = async () => {
    if (!activeRun) return
    await fetch(`/api/challenges/runs/${activeRun.id}/complete`, { method: 'PUT' })
    onRunChange()
  }

  const doCancel = async () => {
    if (!activeRun) return
    await fetch(`/api/challenges/runs/${activeRun.id}`, { method: 'DELETE' })
    onRunChange()
  }

  return (
    <>
      <div className="s-title">PAAR-CHALLENGES</div>
      <p className="s-sub">
        Alle Challenges werden nach <strong style={{ color: 'var(--accent)' }}>relativer Verbesserung</strong> gewertet —
        dein persönlicher Bestwert ist der Ausgangswert. Egal ob 1 oder 30 Wdh. — entscheidend ist, wie sehr DU dich verbesserst.
      </p>

      {challenges.map((c, i) => {
        const isActive = activeRun?.challengeId === c.id
        const anyActive = !!activeRun

        return (
          <div className={`challenge-card${isActive ? ' challenge-card-active' : ''}`} key={c.id}>
            <div className="cc-top">
              <div className="cc-num">0{i + 1}</div>
              <div className="cc-content">
                <div className="cc-title">{c.title}</div>
                <span className={`cc-type type-${c.type}`}>{c.typeLabel}</span>
                <p className="cc-desc">{c.desc}</p>
                <div className="fair-box">
                  <div className="fair-title">⚖️ Wie es fair wird</div>
                  <div className="fair-row">
                    <div className="fair-him">
                      <div className="fair-label">{p1?.name ?? 'Er'}</div>
                      <div className="fair-val">{c.himNote}</div>
                    </div>
                    <div className="fair-her">
                      <div className="fair-label">{p2?.name ?? 'Sie'}</div>
                      <div className="fair-val">{c.herNote}</div>
                    </div>
                  </div>
                  <div className="win-rule">🏆 Siegbedingung: <span>{c.winRule}</span></div>
                </div>

                <div className="challenge-card-actions">
                  {isActive ? (
                    <>
                      <span className="challenge-active-badge">● Aktiv</span>
                      <button className="log-btn" onClick={doComplete}>✓ Abschließen</button>
                      <button className="log-btn secondary" onClick={doCancel}>× Abbrechen</button>
                    </>
                  ) : (
                    <button
                      className="log-btn secondary"
                      disabled={anyActive}
                      onClick={() => openStart(c)}
                    >
                      Starten
                    </button>
                  )}
                </div>

                {startingId === c.id && (
                  <div className="challenge-start-form">
                    <div className="challenge-start-row">
                      <label className="settings-label">Dauer (Tage)</label>
                      <input
                        type="number"
                        min={1}
                        value={startDays}
                        onChange={e => setStartDays(Math.max(1, Number(e.target.value)))}
                        className="log-input"
                        style={{ maxWidth: 90 }}
                      />
                    </div>
                    <div className="edit-form-actions">
                      <button className="log-btn" onClick={() => doStart(c.id)}>Starten</button>
                      <button className="log-btn secondary" onClick={() => setStartingId(null)}>Abbrechen</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
