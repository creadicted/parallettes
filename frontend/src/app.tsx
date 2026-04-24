import { useEffect, useState } from 'react'
import WorkoutsTab from './components/WorkoutsTab'
import ChallengesTab from './components/ChallengesTab'
import TrackerTab from './components/TrackerTab'
import TipsTab from './components/TipsTab'
import DailyTab from './components/DailyTab'
import SettingsTab from './components/SettingsTab'
import EditWorkoutsTab from './components/EditWorkoutsTab'

export interface Player {
  id: number
  name: string
  color: string
  initials: string
}

export interface PlayerScore {
  playerId: number
  points: number
}

export interface HistoryEntry {
  id: number
  challenge: string
  p1Pct: number
  p2Pct: number
  p1Pts: number
  p2Pts: number
  result: string
  date: string
}

export interface State {
  scores: PlayerScore[]
  history: HistoryEntry[]
}

type Route = 'workouts' | 'challenges' | 'tracker' | 'daily' | 'tips' | 'settings' | 'edit-workouts'

const NAV_TABS: { id: Route; label: string }[] = [
  { id: 'workouts', label: 'Workouts' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'tracker', label: 'Punktestand' },
  { id: 'daily', label: 'Tageslog' },
  { id: 'tips', label: 'Tipps' },
]

function useHash() {
  const parse = () => {
    const full = window.location.hash.slice(1) || 'workouts'
    const [route, search] = full.split('?')
    return { route: route as Route, params: new URLSearchParams(search || '') }
  }

  const [state, setState] = useState(parse)

  useEffect(() => {
    const handler = () => setState(parse())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (hash: string) => { window.location.hash = hash }

  return { ...state, navigate }
}

export default function App() {
  const { route, params, navigate } = useHash()
  const [state, setState] = useState<State>({ scores: [], history: [] })
  const [players, setPlayers] = useState<Player[]>([])

  const loadPlayers = () => {
    fetch('/api/players')
      .then(r => r.json())
      .then((data: Player[]) => { if (Array.isArray(data)) setPlayers(data) })
      .catch(console.error)
  }

  useEffect(() => {
    loadPlayers()
    fetch('/api/state')
      .then(r => r.json())
      .then((data: Partial<State>) => { if (data?.scores != null) setState(data as State) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const p1 = players.find(p => p.id === 1)
    const p2 = players.find(p => p.id === 2)
    if (p1) document.documentElement.style.setProperty('--him', p1.color)
    if (p2) document.documentElement.style.setProperty('--her', p2.color)
  }, [players])

  const log = async (challengeId: number, p1Val: number, p2Val: number, p1Base: number, p2Base: number) => {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, p1Val, p2Val, p1Base, p2Base }),
    })
    if (!res.ok) { alert(`Error: ${await res.text()}`); return }
    setState(await res.json())
  }

  const reset = async () => {
    const res = await fetch('/api/state', { method: 'DELETE' })
    if (res.ok) setState(await res.json())
  }

  const isMainRoute = NAV_TABS.some(t => t.id === route)
  const openWorkoutId = params.get('workout') ? Number(params.get('workout')) : null

  return (
    <>
      <div className="hero">
        <button className="gear-btn" onClick={() => navigate('settings')} aria-label="Settings">⚙</button>
        <div className="hero-label">⚡ Partner</div>
        <h1>PARALLETTES<br />CHALLENGE</h1>
        <p className="hero-sub">Workouts, Paar-Challenges &amp; ein Punktestand — gemacht für zwei unterschiedliche Fitnesslevel.</p>
      </div>

      {isMainRoute && (
        <nav className="nav">
          {NAV_TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${route === t.id ? ' active' : ''}`}
              onClick={() => navigate(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {route === 'settings' ? (
        <div className="section active">
          <SettingsTab players={players} onPlayersChange={loadPlayers} onBack={() => navigate('workouts')} />
        </div>
      ) : route === 'edit-workouts' ? (
        <div className="section active">
          <EditWorkoutsTab onBack={() => navigate('workouts')} />
        </div>
      ) : (
        <>
          <section className={`section${route === 'workouts' ? ' active' : ''}`}>
            <WorkoutsTab openWorkoutId={openWorkoutId} onManage={() => navigate('edit-workouts')} />
          </section>
          <section className={`section${route === 'challenges' ? ' active' : ''}`}>
            <ChallengesTab players={players} />
          </section>
          <section className={`section${route === 'tracker' ? ' active' : ''}`}>
            <TrackerTab state={state} players={players} onLog={log} onReset={reset} />
          </section>
          <section className={`section${route === 'daily' ? ' active' : ''}`}>
            <DailyTab players={players} onNavigate={navigate} />
          </section>
          <section className={`section${route === 'tips' ? ' active' : ''}`}>
            <TipsTab />
          </section>
        </>
      )}

      {isMainRoute && (
        <div className="footer-note">
          Gemacht für zwei 💛
        </div>
      )}
    </>
  )
}
