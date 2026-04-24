import { useEffect, useState } from 'react'
import WorkoutsTab from './components/WorkoutsTab'
import ChallengesTab from './components/ChallengesTab'
import TrackerTab from './components/TrackerTab'
import TipsTab from './components/TipsTab'
import DailyTab from './components/DailyTab'

export interface HistoryEntry {
  id: number
  challenge: string
  himPct: number
  herPct: number
  himPts: number
  herPts: number
  result: string
  date: string
}

export interface State {
  scores: { him: number; her: number }
  history: HistoryEntry[]
}

type Tab = 'workouts' | 'challenges' | 'tracker' | 'daily' | 'tips'

const TABS: { id: Tab; label: string }[] = [
  { id: 'workouts', label: 'Workouts' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'tracker', label: 'Score Tracker' },
  { id: 'daily', label: 'Daily Log' },
  { id: 'tips', label: 'Tips' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('workouts')
  const [state, setState] = useState<State>({ scores: { him: 0, her: 0 }, history: [] })

  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then((data: Partial<State>) => {
        if (data?.scores != null) setState(data as State)
      })
      .catch(console.error)
  }, [])

  const log = async (challengeId: number, himVal: number, herVal: number, himBase: number, herBase: number) => {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, himVal, herVal, himBase, herBase }),
    })
    if (!res.ok) {
      const msg = await res.text()
      alert(`Error: ${msg}`)
      return
    }
    setState(await res.json())
  }

  const reset = async () => {
    const res = await fetch('/api/state', { method: 'DELETE' })
    if (res.ok) setState(await res.json())
  }

  return (
    <>
      <div className="hero">
        <div className="hero-label">⚡ Couple Fitness</div>
        <h1>PARALLETTES<br />CHALLENGE</h1>
        <p className="hero-sub">Workouts, fair couple challenges &amp; a point tracker — built for two different fitness levels.</p>
      </div>

      <nav className="nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className={`section${tab === 'workouts' ? ' active' : ''}`}>
        <WorkoutsTab />
      </section>
      <section className={`section${tab === 'challenges' ? ' active' : ''}`}>
        <ChallengesTab />
      </section>
      <section className={`section${tab === 'tracker' ? ' active' : ''}`}>
        <TrackerTab state={state} onLog={log} onReset={reset} />
      </section>
      <section className={`section${tab === 'daily' ? ' active' : ''}`}>
        <DailyTab />
      </section>
      <section className={`section${tab === 'tips' ? ' active' : ''}`}>
        <TipsTab />
      </section>

      <div className="footer-note">
        Built for two 💛 · All challenges score on % improvement from personal baseline<br />
        so different fitness levels stay competitive.
      </div>
    </>
  )
}
