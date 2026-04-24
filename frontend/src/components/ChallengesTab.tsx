import { challenges } from '../data/challenges'

export default function ChallengesTab() {
  return (
    <>
      <div className="s-title">PAAR-CHALLENGES</div>
      <p className="s-sub">
        Alle Challenges werden nach <strong style={{ color: 'var(--accent)' }}>relativer Verbesserung</strong> gewertet —
        dein persönlicher Bestwert ist der Ausgangswert. Egal ob 1 oder 30 Wdh. — entscheidend ist, wie sehr DU dich verbesserst.
      </p>

      {challenges.map((c, i) => (
        <div className="challenge-card" key={c.id}>
          <div className="cc-top">
            <div className="cc-num">0{i + 1}</div>
            <div className="cc-content">
              <div className="cc-title">{c.title}</div>
              <span className={`cc-type type-${c.type}`}>{c.typeLabel}</span>
              <p className="cc-desc">{c.desc}</p>
              <div className="fair-box">
                <div className="fair-title">⚖️ Wie es fair wird</div>
                <div className="fair-row">
                  <div className="fair-him">
                    <div className="fair-label">Er</div>
                    <div className="fair-val">{c.him}</div>
                  </div>
                  <div className="fair-her">
                    <div className="fair-label">Sie</div>
                    <div className="fair-val">{c.her}</div>
                  </div>
                </div>
                <div className="win-rule">🏆 Siegbedingung: <span>{c.winRule}</span></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
