import { useState } from 'react'
import { challenges } from '../data/challenges'
import type { State } from '../app'

interface Props {
  state: State
  onLog: (challengeId: number, himVal: number, herVal: number, himBase: number, herBase: number) => Promise<void>
  onReset: () => Promise<void>
}

export default function TrackerTab({ state, onLog, onReset }: Props) {
  const [challengeId, setChallengeId] = useState('')
  const [himVal, setHimVal] = useState('')
  const [herVal, setHerVal] = useState('')
  const [himBase, setHimBase] = useState('')
  const [herBase, setHerBase] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLog = async () => {
    const id = parseInt(challengeId)
    const hv = parseFloat(himVal)
    const ev = parseFloat(herVal)
    const hb = parseFloat(himBase)
    const eb = parseFloat(herBase)

    if (!id || isNaN(hv) || isNaN(ev) || isNaN(hb) || isNaN(eb)) {
      alert('Please fill in all four values (current result + baseline for each).')
      return
    }

    setSubmitting(true)
    try {
      await onLog(id, hv, ev, hb, eb)
      setChallengeId('')
      setHimVal('')
      setHerVal('')
      setHimBase('')
      setHerBase('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all scores and history?')) return
    await onReset()
  }

  return (
    <>
      <div className="s-title">SCORE TRACKER</div>

      <div className="tracker-intro">
        Points are earned by <strong>winning challenges</strong>. Each challenge awards{' '}
        <strong>3 pts to the winner</strong> and <strong>1 pt to both</strong> if within 5% of each other (a tie).
        Log your challenge results below.
      </div>

      <div className="score-board">
        <div className="score-card him">
          <div className="score-who">Him</div>
          <div className="score-pts">{state.scores.him}</div>
          <div className="score-label">points</div>
        </div>
        <div className="score-card her">
          <div className="score-who">Her</div>
          <div className="score-pts">{state.scores.her}</div>
          <div className="score-label">points</div>
        </div>
      </div>

      <div className="log-section">
        <div className="log-title">Log a Challenge Result</div>
        <div className="log-row">
          <select className="log-select" value={challengeId} onChange={e => setChallengeId(e.target.value)}>
            <option value="">Select challenge…</option>
            {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="log-row">
          <input className="log-input" type="number" placeholder="His result" min="0" value={himVal} onChange={e => setHimVal(e.target.value)} />
          <input className="log-input" type="number" placeholder="Her result" min="0" value={herVal} onChange={e => setHerVal(e.target.value)} />
        </div>
        <div className="log-row">
          <input className="log-input" type="number" placeholder="His baseline (first attempt)" min="0" value={himBase} onChange={e => setHimBase(e.target.value)} />
          <input className="log-input" type="number" placeholder="Her baseline (first attempt)" min="0" value={herBase} onChange={e => setHerBase(e.target.value)} />
        </div>
        <div className="log-row">
          <button className="log-btn" onClick={handleLog} disabled={submitting}>+ Log Result</button>
          <button className="log-btn secondary" onClick={handleReset}>Reset</button>
        </div>
      </div>

      <div className="log-title">History</div>
      {state.history.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🏆</span>
          No challenges logged yet. Get sweating!
        </div>
      ) : (
        <ul className="history-list">
          {state.history.map(e => (
            <li key={e.id}>
              <div>
                <div className="hist-name">{e.challenge}</div>
                <div className="hist-detail">
                  Him +{e.himPct}% · Her +{e.herPct}% · {new Date(e.date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{e.result}</div>
                <div className="hist-pts">
                  <span className="hist-him">+{e.himPts}</span> / <span className="hist-her">+{e.herPts}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
