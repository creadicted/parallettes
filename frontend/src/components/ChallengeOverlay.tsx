import type { ChallengeRun } from '../app'

interface Props {
  run: ChallengeRun | null
  onComplete: () => void
  onCancel: () => void
}

export default function ChallengeOverlay({ run, onComplete, onCancel }: Props) {
  if (!run) return null

  const today = new Date()
  const start = new Date(run.startDate + 'T00:00:00')
  const end = new Date(run.endDate + 'T00:00:00')
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = today.getTime() - start.getTime()
  const remaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000))
  const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))

  return (
    <div className="challenge-overlay">
      <div className="challenge-overlay-label">Aktive Challenge</div>
      <div className="challenge-overlay-title">{run.challengeTitle}</div>
      <div className="challenge-overlay-bar">
        <div className="challenge-overlay-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="challenge-overlay-remaining">
        {remaining === 0 ? 'Letzter Tag' : `${remaining} Tage verbleibend`}
      </div>
      <div className="challenge-overlay-actions">
        <button className="challenge-overlay-btn complete" onClick={onComplete}>✓ Fertig</button>
        <button className="challenge-overlay-btn cancel" onClick={onCancel}>× Ende</button>
      </div>
    </div>
  )
}
