import { useEffect, useState } from 'react'
import { actions } from '../data/actions'

interface DailyLog {
  id: number
  date: string
  person: 'him' | 'her'
  action: string
  count: number
  unit: string
  createdAt: string
}

type Person = 'him' | 'her'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']

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

export default function DailyTab() {
  const today = new Date()
  const todayStr = toDateStr(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [person, setPerson] = useState<Person>('him')
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [counts, setCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(actions.map(a => [a.name, a.defaultCount]))
  )

  useEffect(() => {
    fetch(`/api/daily?date=${selectedDate}`)
      .then(r => r.json())
      .then((data: DailyLog[]) => setLogs(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [selectedDate])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const adjustCount = (name: string, delta: number) => {
    setCounts(prev => ({ ...prev, [name]: Math.max(1, (prev[name] ?? 1) + delta) }))
  }

  const logAction = async (action: { name: string; unit: string }, count: number) => {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, person, action: action.name, count, unit: action.unit }),
    })
    if (res.ok) setLogs(await res.json())
  }

  const removeLog = async (id: number) => {
    const res = await fetch(`/api/daily/${id}?date=${selectedDate}`, { method: 'DELETE' })
    if (res.ok) setLogs(await res.json())
  }

  const cells = buildCalendarCells(viewYear, viewMonth)
  const selectedDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <div className="s-title">DAILY LOG</div>
      <p className="s-sub">Pick a date, select who is logging, then tap an exercise.</p>

      {/* Calendar */}
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
            return (
              <div
                key={i}
                className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedDate(toDateStr(new Date(viewYear, viewMonth, day)))}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Person toggle */}
      <div className="person-toggle-wrap">
        <span className="log-title" style={{ margin: 0 }}>Logging as</span>
        <div className="person-toggle">
          <button
            className={`person-toggle-btn him${person === 'him' ? ' active' : ''}`}
            onClick={() => setPerson('him')}
          >Him</button>
          <button
            className={`person-toggle-btn her${person === 'her' ? ' active' : ''}`}
            onClick={() => setPerson('her')}
          >Her</button>
        </div>
      </div>

      {/* Action list */}
      <div className="log-title" style={{ marginTop: 20 }}>Log for {selectedDisplay}</div>
      <div className="action-list">
        {actions.map(a => (
          <div key={a.name} className={`action-item ${person}`} onClick={() => logAction(a, counts[a.name])}>
            <div className="action-counter" onClick={e => e.stopPropagation()}>
              <button className="counter-btn" onClick={() => adjustCount(a.name, -1)}>−</button>
              <span className="counter-val">{counts[a.name]}</span>
              <button className="counter-btn" onClick={() => adjustCount(a.name, +1)}>+</button>
            </div>
            <span className="action-name">{a.name}</span>
            <span className="action-unit">{a.unit}</span>
          </div>
        ))}
      </div>

      {/* Daily log list */}
      <div className="log-title" style={{ marginTop: 28 }}>
        {logs.length > 0 ? `${logs.length} entr${logs.length === 1 ? 'y' : 'ies'} logged` : 'Logged'}
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📋</span>
          Nothing logged yet — tap an exercise above.
        </div>
      ) : (
        <ul className="history-list">
          {logs.map(l => (
            <li key={l.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`person-badge ${l.person}`}>{l.person === 'him' ? 'Him' : 'Her'}</span>
                <div>
                  <div className="hist-name">{l.action}</div>
                  <div className="hist-detail">{l.count} {l.unit}</div>
                </div>
              </div>
              <button
                onClick={() => removeLog(l.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}
                aria-label="remove"
              >×</button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
