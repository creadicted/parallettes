import { useEffect, useState } from 'react'

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
  unit: string
  defaultCount: number
}

interface Props {
  onBack: () => void
}

const TAG_OPTIONS: WorkoutTag[] = [
  { label: 'Low Short', cls: 'tag-low' },
  { label: 'Low Long', cls: 'tag-low' },
  { label: 'High Long', cls: 'tag-high' },
  { label: 'Beginner', cls: 'tag-beginner' },
  { label: 'Intermediate', cls: 'tag-inter' },
  { label: 'Advanced', cls: 'tag-adv' },
]

const BLANK_WORKOUT: Omit<Workout, 'id'> = {
  icon: '', name: '', groupLabel: '', tags: [], desc: '', steps: [], sets: '', unit: 'reps', defaultCount: 10,
}

function WorkoutForm({
  initial, onSave, onCancel,
}: {
  initial: Omit<Workout, 'id'>
  onSave: (w: Omit<Workout, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...initial, stepsText: initial.steps.join('\n') })

  const toggleTag = (tag: WorkoutTag) => {
    const has = form.tags.some(t => t.label === tag.label)
    setForm(f => ({ ...f, tags: has ? f.tags.filter(t => t.label !== tag.label) : [...f.tags, tag] }))
  }

  const submit = () => {
    onSave({
      icon: form.icon, name: form.name, groupLabel: form.groupLabel, tags: form.tags,
      desc: form.desc, steps: form.stepsText.split('\n').map(s => s.trim()).filter(Boolean),
      sets: form.sets, unit: form.unit, defaultCount: form.defaultCount,
    })
  }

  return (
    <div className="edit-form">
      <div className="edit-form-row">
        <input className="log-input" style={{ maxWidth: 60 }} placeholder="Icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
        <input className="log-input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1 }} />
      </div>
      <div className="edit-form-row">
        <select className="log-select" style={{ maxWidth: 100 }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
          <option value="reps">reps</option>
          <option value="sec">sec</option>
          <option value="min">min</option>
        </select>
        <input className="log-input" style={{ maxWidth: 120 }} type="number" placeholder="Standard-Anzahl" min="1" value={form.defaultCount} onChange={e => setForm(f => ({ ...f, defaultCount: parseInt(e.target.value) || 1 }))} />
      </div>
      <input className="log-input" placeholder="Gruppe (z.B. 🌱 Anfänger — Grundlagen aufbauen)" value={form.groupLabel} onChange={e => setForm(f => ({ ...f, groupLabel: e.target.value }))} style={{ marginBottom: 8 }} />
      <div className="edit-tags-row">
        {TAG_OPTIONS.map(t => (
          <button
            key={t.label}
            className={`tag ${t.cls}${form.tags.some(ft => ft.label === t.label) ? ' tag-selected' : ''}`}
            onClick={() => toggleTag(t)}
            type="button"
          >{t.label}</button>
        ))}
      </div>
      <textarea className="edit-textarea" placeholder="Beschreibung" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} />
      <textarea className="edit-textarea" placeholder="Schritte (einer pro Zeile)" value={form.stepsText} onChange={e => setForm(f => ({ ...f, stepsText: e.target.value }))} rows={5} />
      <input className="log-input" placeholder="Sätze (z.B. 3 Sätze · 10 Wdh. · 90s Pause)" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} style={{ marginBottom: 8 }} />
      <div className="edit-form-actions">
        <button className="log-btn" onClick={submit}>Speichern</button>
        <button className="log-btn secondary" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  )
}

export default function EditWorkoutsTab({ onBack }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [editingWorkout, setEditingWorkout] = useState<number | 'new' | null>(null)

  const load = async () => {
    const data = await fetch('/api/workouts').then(r => r.json())
    if (Array.isArray(data)) setWorkouts(data)
  }

  useEffect(() => { load() }, [])

  const saveWorkout = async (data: Omit<Workout, 'id'>, id?: number) => {
    const url = id ? `/api/workouts/${id}` : '/api/workouts'
    await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setEditingWorkout(null)
    load()
  }

  const deleteWorkout = async (id: number) => {
    if (!confirm('Dieses Workout löschen?')) return
    await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <div className="s-title">WORKOUTS VERWALTEN</div>

      <div className="edit-section-title">Workout-Beschreibungen</div>
      {workouts.map(w => (
        <div key={w.id} className="edit-item">
          {editingWorkout === w.id ? (
            <WorkoutForm
              initial={{ icon: w.icon, name: w.name, groupLabel: w.groupLabel, tags: w.tags, desc: w.desc, steps: w.steps, sets: w.sets, unit: w.unit, defaultCount: w.defaultCount }}
              onSave={data => saveWorkout(data, w.id)}
              onCancel={() => setEditingWorkout(null)}
            />
          ) : (
            <div className="edit-item-row">
              <span className="edit-item-icon">{w.icon}</span>
              <div className="edit-item-info">
                <div className="edit-item-name">{w.name}</div>
                <div className="edit-item-sub">{w.groupLabel} · {w.defaultCount} {w.unit}</div>
              </div>
              <div className="edit-item-btns">
                <button className="edit-btn" onClick={() => setEditingWorkout(w.id)}>Bearbeiten</button>
                <button className="edit-btn delete" onClick={() => deleteWorkout(w.id)}>×</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editingWorkout === 'new' ? (
        <WorkoutForm
          initial={BLANK_WORKOUT}
          onSave={data => saveWorkout(data)}
          onCancel={() => setEditingWorkout(null)}
        />
      ) : (
        <button className="log-btn secondary" style={{ width: '100%', marginBottom: 32 }} onClick={() => setEditingWorkout('new')}>
          + Workout hinzufügen
        </button>
      )}
    </>
  )
}
