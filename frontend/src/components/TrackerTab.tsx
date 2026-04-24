import { useState } from 'react'
import { challenges } from '../data/challenges'
import type { State, Player } from '../app'

interface Props {
  state: State
  players: Player[]
  onLog: (challengeId: number, p1Val: number, p2Val: number, p1Base: number, p2Base: number) => Promise<void>
  onReset: () => Promise<void>
}

export default function TrackerTab({ state, players, onLog, onReset }: Props) {
  const [challengeId, setChallengeId] = useState('')
  const [p1Val, setP1Val] = useState('')
  const [p2Val, setP2Val] = useState('')
  const [p1Base, setP1Base] = useState('')
  const [p2Base, setP2Base] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLog = async () => {
    const id = parseInt(challengeId)
    const v1 = parseFloat(p1Val), v2 = parseFloat(p2Val)
    const b1 = parseFloat(p1Base), b2 = parseFloat(p2Base)
    if (!id || isNaN(v1) || isNaN(v2) || isNaN(b1) || isNaN(b2)) {
      alert('Bitte alle vier Werte ausfüllen (aktuelles Ergebnis + Ausgangswert für jede Person).')
      return
    }
    setSubmitting(true)
    try {
      await onLog(id, v1, v2, b1, b2)
      setChallengeId('')
      setP1Val(''); setP2Val(''); setP1Base(''); setP2Base('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Alle Punkte und den Verlauf zurücksetzen?')) return
    await onReset()
  }

  const p1 = players.find(p => p.id === 1)
  const p2 = players.find(p => p.id === 2)
  const p1Score = state.scores.find(s => s.playerId === 1)?.points ?? 0
  const p2Score = state.scores.find(s => s.playerId === 2)?.points ?? 0

  return (
    <>
      <div className="s-title">PUNKTESTAND</div>

      <div className="tracker-intro">
        Punkte werden durch <strong>gewonnene Challenges</strong> verdient. Jede Challenge gibt{' '}
        <strong>3 Punkte an den Gewinner</strong> und <strong>1 Punkt für beide</strong> bei einem Unentschieden (weniger als 5% Unterschied).
        Challenge-Ergebnisse unten eintragen.
      </div>

      <div className="score-board">
        <div className="score-card him">
          <div className="score-who">{p1?.name ?? 'Player 1'}</div>
          <div className="score-pts">{p1Score}</div>
          <div className="score-label">Punkte</div>
        </div>
        <div className="score-card her">
          <div className="score-who">{p2?.name ?? 'Player 2'}</div>
          <div className="score-pts">{p2Score}</div>
          <div className="score-label">Punkte</div>
        </div>
      </div>

      <div className="log-section">
        <div className="log-title">Challenge-Ergebnis eintragen</div>
        <div className="log-row">
          <select className="log-select" value={challengeId} onChange={e => setChallengeId(e.target.value)}>
            <option value="">Challenge wählen…</option>
            {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="log-row">
          <input className="log-input" type="number" placeholder={`${p1?.name ?? 'Spieler 1'} Ergebnis`} min="0" value={p1Val} onChange={e => setP1Val(e.target.value)} />
          <input className="log-input" type="number" placeholder={`${p2?.name ?? 'Spieler 2'} Ergebnis`} min="0" value={p2Val} onChange={e => setP2Val(e.target.value)} />
        </div>
        <div className="log-row">
          <input className="log-input" type="number" placeholder={`${p1?.name ?? 'Spieler 1'} Ausgangswert`} min="0" value={p1Base} onChange={e => setP1Base(e.target.value)} />
          <input className="log-input" type="number" placeholder={`${p2?.name ?? 'Spieler 2'} Ausgangswert`} min="0" value={p2Base} onChange={e => setP2Base(e.target.value)} />
        </div>
        <div className="log-row">
          <button className="log-btn" onClick={handleLog} disabled={submitting}>+ Ergebnis eintragen</button>
          <button className="log-btn secondary" onClick={handleReset}>Zurücksetzen</button>
        </div>
      </div>

      <div className="log-title">Verlauf</div>
      {state.history.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🏆</span>
          Noch keine Challenges eingetragen. Los geht's!
        </div>
      ) : (
        <ul className="history-list">
          {state.history.map(e => (
            <li key={e.id}>
              <div>
                <div className="hist-name">{e.challenge}</div>
                <div className="hist-detail">
                  {p1?.name ?? 'P1'} +{e.p1Pct}% · {p2?.name ?? 'P2'} +{e.p2Pct}% · {new Date(e.date).toLocaleDateString('de-DE')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{e.result}</div>
                <div className="hist-pts">
                  <span className="hist-him">+{e.p1Pts}</span> / <span className="hist-her">+{e.p2Pts}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
