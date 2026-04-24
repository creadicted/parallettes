import { useEffect, useRef, useState } from 'react'

interface WorkoutTag {
  label: string
  cls: string
}

interface Workout {
  id: number
  icon: string
  name: string
  groupLabel: string
  tags: WorkoutTag[]
  desc: string
  steps: string[]
  sets: string
}

interface Props {
  openWorkoutId: number | null
  onManage: () => void
}

export default function WorkoutsTab({ openWorkoutId, onManage }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const openRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/workouts')
      .then(r => r.json())
      .then((data: Workout[]) => { if (Array.isArray(data)) setWorkouts(data) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (openWorkoutId != null) setOpenId(openWorkoutId)
  }, [openWorkoutId])

  useEffect(() => {
    if (openId != null && openRef.current) {
      setTimeout(() => openRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }
  }, [openId, workouts.length])

  const groups = workouts.reduce<{ label: string; workouts: Workout[] }[]>((acc, w) => {
    const g = acc.find(g => g.label === w.groupLabel)
    if (g) g.workouts.push(w)
    else acc.push({ label: w.groupLabel, workouts: [w] })
    return acc
  }, [])

  return (
    <>
      <div className="equip-row">
        <div className="equip-card">
          <div className="equip-icon">⬜</div>
          <div className="equip-name">Niedrig Kurz</div>
          <div className="equip-desc">~15cm · Liegestütze, L-Sits</div>
        </div>
        <div className="equip-card">
          <div className="equip-icon">▬</div>
          <div className="equip-name">Niedrig Lang</div>
          <div className="equip-desc">~15cm · Dips, Rows</div>
        </div>
        <div className="equip-card">
          <div className="equip-icon">▐</div>
          <div className="equip-name">Hoch Lang</div>
          <div className="equip-desc">~45cm · Pike, Support Holds</div>
        </div>
      </div>

      <button className="manage-workouts-btn" onClick={onManage}>✎ Workouts verwalten</button>

      {groups.map(group => (
        <div className="workout-group" key={group.label}>
          <div className="group-label">{group.label}</div>
          {group.workouts.map(w => {
            const isOpen = openId === w.id
            return (
              <div
                key={w.id}
                ref={isOpen ? openRef : null}
                className={`workout-card${isOpen ? ' open' : ''}`}
                onClick={() => setOpenId(prev => prev === w.id ? null : w.id)}
              >
                <div className="wc-header">
                  <div className="wc-icon">{w.icon}</div>
                  <div className="wc-info">
                    <div className="wc-name">{w.name}</div>
                    <div className="wc-tags">
                      {w.tags.map(t => <span key={t.label} className={`tag ${t.cls}`}>{t.label}</span>)}
                    </div>
                  </div>
                  <div className="wc-chevron">▼</div>
                </div>
                <div className="wc-body" style={{ maxHeight: isOpen ? '600px' : '0' }}>
                  <div className="wc-body-inner">
                    <p className="wc-desc">{w.desc}</p>
                    <ul className="wc-steps">
                      {w.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                    <div className="wc-sets">{w.sets}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
