import { useEffect, useState } from 'react'
import type { Player } from '../app'

interface Workout {
  id: number
  name: string
  unit: string
  defaultCount: number
}

interface DailyLog {
  id: number
  date: string
  playerId: number
  workoutId: number
  workoutName: string
  count: number
  unit: string
  createdAt: string
}

interface Props {
  players: Player[]
  onNavigate: (hash: string) => void
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function buildStrip(centerDateStr: string) {
  const center = new Date(centerDateStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(center)
    d.setDate(d.getDate() + (i - 3))
    return d
  })
}

export default function DailyTab({ players, onNavigate }: Props) {
  const today = new Date()
  const todayStr = toDateStr(today)

  const [subTab, setSubTab] = useState<'kalender' | 'eintragen'>('kalender')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedPlayer, setSelectedPlayer] = useState<number>(1)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [monthLogs, setMonthLogs] = useState<Record<string, number[]>>({})

  useEffect(() => {
    fetch('/api/workouts')
      .then(r => r.json())
      .then((data: Workout[]) => {
        if (Array.isArray(data)) {
          setWorkouts(data)
          setCounts(Object.fromEntries(data.map(w => [w.id, w.defaultCount])))
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch(`/api/daily?date=${selectedDate}`)
      .then(r => r.json())
      .then((data: DailyLog[]) => setLogs(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [selectedDate])

  const fetchMonthLogs = (year: number, month: number) => {
    fetch(`/api/daily/month?year=${year}&month=${month + 1}`)
      .then(r => r.json())
      .then((data: Record<string, number[]>) => { if (data && typeof data === 'object') setMonthLogs(data) })
      .catch(console.error)
  }

  useEffect(() => { fetchMonthLogs(viewYear, viewMonth) }, [viewYear, viewMonth])

  // Sync viewMonth when selectedDate moves to a different month (from date strip)
  useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    const m = d.getMonth()
    const y = d.getFullYear()
    if (m !== viewMonth || y !== viewYear) {
      setViewMonth(m)
      setViewYear(y)
    }
  }, [selectedDate])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const adjustCount = (id: number, delta: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }))
  }

  const logAction = async (workout: Workout, count: number) => {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, playerId: selectedPlayer, workoutId: workout.id, count }),
    })
    if (res.ok) {
      setLogs(await res.json())
      fetchMonthLogs(viewYear, viewMonth)
    }
  }

  const removeLog = async (id: number) => {
    const res = await fetch(`/api/daily/${id}?date=${selectedDate}`, { method: 'DELETE' })
    if (res.ok) {
      setLogs(await res.json())
      fetchMonthLogs(viewYear, viewMonth)
    }
  }

  const cells = buildCalendarCells(viewYear, viewMonth)
  const stripDays = buildStrip(selectedDate)
  const selectedDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <div className="s-title">TAGESLOG</div>
      <p className="s-sub">Datum im Kalender wählen, dann Übungen eintragen.</p>

      <div className="daily-sub-nav">
        <button
          className={`daily-sub-btn${subTab === 'kalender' ? ' active' : ''}`}
          onClick={() => setSubTab('kalender')}
        >Kalender</button>
        <button
          className={`daily-sub-btn${subTab === 'eintragen' ? ' active' : ''}`}
          onClick={() => setSubTab('eintragen')}
        >Eintragen</button>
      </div>

      {subTab === 'kalender' && (
        <>
          <div className="cal-wrap">
            <div className="cal-header">
              <button className="cal-nav" onClick={prevMonth}>‹</button>
              <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
              <button className="cal-nav" onClick={nextMonth}>›</button>
            </div>
            <div className="cal-grid">
              {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const dateStr = toDateStr(new Date(viewYear, viewMonth, day))
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const dotsForDay = monthLogs[dateStr] ?? []
                return (
                  <div
                    key={i}
                    className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedDate(toDateStr(new Date(viewYear, viewMonth, day)))}
                  >
                    <span>{day}</span>
                    {dotsForDay.length > 0 && (
                      <div className="cal-dots">
                        {dotsForDay.map(pid => {
                          const p = players.find(p => p.id === pid)
                          return p ? <span key={pid} className="cal-dot" style={{ background: p.color }} /> : null
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="log-title" style={{ marginTop: 24 }}>
            {logs.length > 0 ? `${logs.length} Eintr${logs.length === 1 ? 'ag' : 'äge'} — ` : 'Einträge — '}{selectedDisplay}
          </div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <span className="emoji">📋</span>
              Noch nichts eingetragen — wechsle zum Eintragen-Tab.
            </div>
          ) : (
            <ul className="history-list">
              {logs.map(l => {
                const lp = players.find(p => p.id === l.playerId)
                return (
                  <li key={l.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className={`person-badge${l.playerId === 1 ? ' him' : ' her'}`}
                        style={lp ? { background: `${lp.color}26`, color: lp.color } : {}}
                      >
                        {lp?.initials ?? String(l.playerId)}
                      </span>
                      <div>
                        <div className="hist-name">{l.workoutName}</div>
                        <div className="hist-detail">{l.count} {l.unit}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLog(l.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}
                      aria-label="löschen"
                    >×</button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {subTab === 'eintragen' && (
        <>
          {/* Date strip: selectedDate ±3 days */}
          <div className="date-strip">
            {stripDays.map((d, i) => {
              const dateStr = toDateStr(d)
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === todayStr
              const dots = monthLogs[dateStr] ?? []
              const dow = DAYS[(d.getDay() + 6) % 7]
              return (
                <div
                  key={i}
                  className={`date-strip-cell${isSelected ? ' selected' : ''}${isToday && !isSelected ? ' today' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="date-strip-dow">{dow}</div>
                  <div className="date-strip-num">{d.getDate()}</div>
                  <div className="date-strip-dots">
                    {dots.map(pid => {
                      const p = players.find(p => p.id === pid)
                      return p ? <span key={pid} className="cal-dot" style={{ background: isSelected ? 'rgba(0,0,0,0.5)' : p.color }} /> : null
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Person toggle */}
          <div className="person-toggle-wrap" style={{ marginTop: 0, marginBottom: 12 }}>
            <span className="log-title" style={{ margin: 0 }}>Eintragen als</span>
            <div className="person-toggle">
              {players.map(p => (
                <button
                  key={p.id}
                  className={`person-toggle-btn${p.id === 1 ? ' him' : ' her'}${selectedPlayer === p.id ? ' active' : ''}`}
                  style={selectedPlayer === p.id ? { background: p.color, color: '#000' } : {}}
                  onClick={() => setSelectedPlayer(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Split: action list | log entries */}
          <div className="eintragen-split">
            <div className="action-list">
              {workouts.map(w => (
                <div
                  key={w.id}
                  className={`action-item${selectedPlayer === 1 ? ' him' : ' her'}`}
                  onClick={() => logAction(w, counts[w.id] ?? w.defaultCount)}
                >
                  <div className="action-counter" onClick={e => e.stopPropagation()}>
                    <button className="counter-btn" onClick={() => adjustCount(w.id, -1)}>−</button>
                    <span className="counter-val">{counts[w.id] ?? w.defaultCount}</span>
                    <button className="counter-btn" onClick={() => adjustCount(w.id, +1)}>+</button>
                  </div>
                  <span className="action-name">{w.name}</span>
                  <span className="action-unit">{w.unit}</span>
                  <button
                    className="action-info-btn"
                    onClick={e => { e.stopPropagation(); onNavigate(`workouts?workout=${w.id}`) }}
                    title="Workout-Beschreibung anzeigen"
                  >ⓘ</button>
                </div>
              ))}
            </div>

            <div className="eintragen-log">
              <div className="log-title" style={{ marginBottom: 8 }}>
                {logs.length > 0
                  ? `${logs.length} Eintr${logs.length === 1 ? 'ag' : 'äge'}`
                  : 'Einträge'} — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
              </div>
              {logs.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <span className="emoji" style={{ fontSize: 24 }}>📋</span>
                  Noch leer
                </div>
              ) : (
                <ul className="history-list">
                  {logs.map(l => {
                    const lp = players.find(p => p.id === l.playerId)
                    return (
                      <li key={l.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className={`person-badge${l.playerId === 1 ? ' him' : ' her'}`}
                            style={lp ? { background: `${lp.color}26`, color: lp.color } : {}}
                          >
                            {lp?.initials ?? String(l.playerId)}
                          </span>
                          <div>
                            <div className="hist-name">{l.workoutName}</div>
                            <div className="hist-detail">{l.count} {l.unit}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeLog(l.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}
                          aria-label="löschen"
                        >×</button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
