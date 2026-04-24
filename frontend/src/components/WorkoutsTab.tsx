import { useState } from 'react'

interface Workout {
  icon: string
  name: string
  tags: { label: string; cls: string }[]
  desc: string
  steps: string[]
  sets: string
}

interface WorkoutGroup {
  label: string
  workouts: Workout[]
}

const groups: WorkoutGroup[] = [
  {
    label: '🌱 Beginner — Build the base',
    workouts: [
      {
        icon: '🤲', name: 'Elevated Push-Ups',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Beginner', cls: 'tag-beginner' }],
        desc: 'Push-ups on parallettes give you a deeper range of motion than floor push-ups, building chest, shoulders and triceps more effectively — even at low reps.',
        steps: ['Place both low short bars shoulder-width apart', 'Grip the bars, arms extended, body in a plank line', 'Lower chest below bar level (this is the bonus depth!)', 'Press back up fully, shoulders packed down', 'Keep core tight — don\'t let hips sag'],
        sets: '3 sets · 5–15 reps · 90s rest',
      },
      {
        icon: '🪑', name: 'Support Hold',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Beginner', cls: 'tag-beginner' }],
        desc: 'The foundation of all parallette work. Holding yourself off the ground builds wrist, shoulder, and core stability simultaneously.',
        steps: ['Grip bars, press down to lift body off the floor', 'Arms fully extended, shoulders depressed (not shrugged)', 'Feet can rest lightly to start — build up to full hold', 'Hold for as long as form holds'],
        sets: '3–5 holds · 10–30 seconds · 60s rest',
      },
      {
        icon: '🦵', name: 'Tuck Hold (L-sit Progression)',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Beginner', cls: 'tag-beginner' }],
        desc: 'The gateway to the L-sit. Tuck your knees to chest while in support hold. This trains hip flexors, core and shoulder stability at the same time.',
        steps: ['Start in support hold on low short bars', 'Pull knees up toward chest (tuck position)', 'Try to keep knees slightly above bar height', 'Hold the position, breathing steadily'],
        sets: '3–5 holds · 5–20 seconds · 90s rest',
      },
      {
        icon: '🔽', name: 'Parallette Dips',
        tags: [{ label: 'Low Long', cls: 'tag-low' }, { label: 'Beginner', cls: 'tag-beginner' }],
        desc: 'Use the low long bar for dips. Triceps, chest, and front delts — a perfect complement to push-ups. Feet can stay on the floor to start.',
        steps: ['Sit between the low long bars, hands gripping outside hips', 'Press up into support, legs extended or bent for assistance', 'Lower slowly until upper arms are parallel to floor', 'Press up fully — don\'t lock elbows aggressively'],
        sets: '3 sets · 5–12 reps · 90s rest',
      },
    ],
  },
  {
    label: '🔥 Intermediate — Level up',
    workouts: [
      {
        icon: '📐', name: 'L-Sit Hold',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Intermediate', cls: 'tag-inter' }],
        desc: 'Legs out straight, parallel to the floor, while in support hold. One of the most rewarding calisthenics skills — it looks easy, but demands massive core and hip flexor strength.',
        steps: ['From tuck hold, begin to extend one leg, then both', 'Point toes, keep legs together and parallel to floor', 'Shoulders slightly forward of hands helps', 'Work up in time — even 3 seconds counts'],
        sets: '4–6 holds · 5–20 seconds · 2 min rest',
      },
      {
        icon: '🏔️', name: 'Pike Push-Ups',
        tags: [{ label: 'High Long', cls: 'tag-high' }, { label: 'Intermediate', cls: 'tag-inter' }],
        desc: 'Hands on the high long bar, feet on the floor, hips high — this targets shoulders heavily. A stepping stone toward the handstand push-up.',
        steps: ['Place hands on high bar, walk feet in so hips are high', 'Body forms an upside-down V shape', 'Bend elbows to lower head toward the bar', 'Press back up — keep elbows from flaring too wide'],
        sets: '3 sets · 6–12 reps · 90s rest',
      },
      {
        icon: '🦅', name: 'Planche Lean',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Intermediate', cls: 'tag-inter' }],
        desc: 'In push-up position on the parallettes, lean your shoulders forward of your hands. Builds the straight-arm strength needed for advanced planche work.',
        steps: ['Start in push-up position on low short bars, arms extended', 'Lean shoulders forward past the bar — 1–4 cm to start', 'Hold body rigid — squeeze glutes and core hard', 'Hold, then return to neutral'],
        sets: '4 holds · 5–15 seconds · 2 min rest',
      },
      {
        icon: '🔁', name: 'Parallette Pass-Throughs',
        tags: [{ label: 'Low Long', cls: 'tag-low' }, { label: 'Intermediate', cls: 'tag-inter' }],
        desc: 'A flowing movement — support hold, swing legs through to front support, then back. Develops hip mobility, shoulder stability, and coordination all at once.',
        steps: ['Start in front support (push-up position) on long bars', 'Swing legs through bars to back support (facing up)', 'Hold briefly, then swing back to front support', 'Control the swing — don\'t just flop through'],
        sets: '3 sets · 6–10 pass-throughs · 90s rest',
      },
    ],
  },
  {
    label: '🚀 Advanced — Party tricks',
    workouts: [
      {
        icon: '🤸', name: 'Handstand Hold (Wall-Assisted)',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Advanced', cls: 'tag-adv' }],
        desc: 'Use the parallettes for a more wrist-friendly handstand. The neutral grip reduces wrist strain significantly and lets you build time upside down.',
        steps: ['Place low short bars near a wall', 'Kick up to handstand with heels against the wall', 'Press down hard through bars, shoulders active', 'Work on reducing wall contact over time'],
        sets: '4–6 holds · 10–30 seconds · 2 min rest',
      },
      {
        icon: '💀', name: 'Tuck Planche Hold',
        tags: [{ label: 'Low Short', cls: 'tag-low' }, { label: 'Advanced', cls: 'tag-adv' }],
        desc: 'The gateway to the full planche. Body parallel to the floor, supported only by straight arms. Demands serious protraction and straight-arm strength.',
        steps: ['Start in planche lean position', 'Slowly shift weight forward and lean until toes lift', 'Knees tucked to chest, hips above hands', 'Hold position — even 2 seconds is a win to start'],
        sets: '4–6 holds · 2–10 seconds · 3 min rest',
      },
    ],
  },
]

export default function WorkoutsTab() {
  const [openIdx, setOpenIdx] = useState<string | null>(null)

  const toggle = (key: string) => setOpenIdx(prev => prev === key ? null : key)

  return (
    <>
      <div className="equip-row">
        <div className="equip-card">
          <div className="equip-icon">⬜</div>
          <div className="equip-name">Low Short</div>
          <div className="equip-desc">~15cm · Pushups, L-sits</div>
        </div>
        <div className="equip-card">
          <div className="equip-icon">▬</div>
          <div className="equip-name">Low Long</div>
          <div className="equip-desc">~15cm · Dips, rows</div>
        </div>
        <div className="equip-card">
          <div className="equip-icon">▐</div>
          <div className="equip-name">High Long</div>
          <div className="equip-desc">~45cm · Pike, support holds</div>
        </div>
      </div>

      {groups.map(group => (
        <div className="workout-group" key={group.label}>
          <div className="group-label">{group.label}</div>
          {group.workouts.map((w, i) => {
            const key = `${group.label}-${i}`
            const isOpen = openIdx === key
            return (
              <div className={`workout-card${isOpen ? ' open' : ''}`} key={key} onClick={() => toggle(key)}>
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
                      {w.steps.map(s => <li key={s}>{s}</li>)}
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
