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
  const [activeGroupLabel, setActiveGroupLabel] = useState<string | null>(null)
  const openRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/workouts')
      .then(r => r.json())
      .then((data: Workout[]) => { if (Array.isArray(data)) setWorkouts(data) })
      .catch(console.error)
  }, [])

  const groups = workouts.reduce<{ label: string; workouts: Workout[] }[]>((acc, w) => {
    const g = acc.find(g => g.label === w.groupLabel)
    if (g) g.workouts.push(w)
    else acc.push({ label: w.groupLabel, workouts: [w] })
    return acc
  }, [])

  useEffect(() => {
    if (groups.length > 0 && activeGroupLabel === null) {
      setActiveGroupLabel(groups[0].label)
    }
  }, [groups.length, activeGroupLabel])

  useEffect(() => {
    if (openWorkoutId != null) {
      setOpenId(openWorkoutId)
      const w = workouts.find(w => w.id === openWorkoutId)
      if (w) setActiveGroupLabel(w.groupLabel)
    }
  }, [openWorkoutId, workouts.length])

  useEffect(() => {
    if (openId != null && openRef.current) {
      setTimeout(() => openRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }
  }, [openId, workouts.length])

  const activeGroup = groups.find(g => g.label === activeGroupLabel) ?? groups[0] ?? null

  return (
    <>
      <div className="s-sub">Parallettes Equipment</div>
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

      <div className="manage-workouts-row">
        <button className="manage-workouts-btn" onClick={onManage}>✎ Workouts verwalten</button>
      </div>

      <div className="workout-level-tabs">
        {groups.map(g => {
          const label = g.label.split(' — ')[0]
          return (
            <button
              key={g.label}
              className={`workout-level-btn${activeGroup?.label === g.label ? ' active' : ''}`}
              onClick={() => setActiveGroupLabel(g.label)}
            >
              {label}
            </button>
          )
        })}
      </div>

      {activeGroup && activeGroup.workouts.map(w => {
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
    </>
  )
}
