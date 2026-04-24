const tips = [
  { icon: '🤝', title: 'Wrists need warming up', body: 'Parallette work puts unusual load on wrists. Spend 3–5 min on wrist circles, push-ups on knuckles, and wrist flexor stretches before every session. Skip this and you\'ll regret it.' },
  { icon: '📏', title: 'Grip width matters', body: 'For push-ups and L-sits, bars roughly shoulder-width apart. Too wide = shoulder strain. Too narrow = awkward elbow position. Find your sweet spot in the first session.' },
  { icon: '⏳', title: 'Holds beat reps — at first', body: 'Isometric holds (support hold, tuck hold, L-sit) build the neuromuscular foundation faster than reps for beginners. Don\'t rush to dynamic movements.' },
  { icon: '📅', title: '2–3x per week is enough', body: 'Parallette work is intense on joints and tendons. Rest days matter. A 3-day on, 1-day off rhythm works great. Train together on the same days for accountability.' },
  { icon: '🎯', title: 'Set baseline scores first', body: 'Before starting challenges, record your Day 1 numbers for each challenge — max push-up reps, max L-sit hold, etc. The improvement percentage is how you compare fairly.' },
  { icon: '💪', title: 'Suggested starter routine', body: 'Week 1–2: Support holds (3×20s), Tuck holds (3×10s), Push-ups (3×5). Week 3–4: Add dips and L-sit attempts. Week 5+: Introduce pike push-ups and pass-throughs. Challenges can start Week 2.' },
  { icon: '🏆', title: 'Celebrate ALL progress', body: 'Going from 1 to 3 push-ups is a 200% improvement. Going from 30 to 33 is only 10%. The relative scoring system exists precisely to make this fair — trust it.' },
]

export default function TipsTab() {
  return (
    <>
      <div className="s-title">GETTING STARTED</div>
      <p className="s-sub">First time on parallettes? These will save you weeks of frustration.</p>
      {tips.map(t => (
        <div className="tip-card" key={t.title}>
          <div className="tip-icon">{t.icon}</div>
          <div className="tip-text">
            <h4>{t.title}</h4>
            <p>{t.body}</p>
          </div>
        </div>
      ))}
    </>
  )
}
