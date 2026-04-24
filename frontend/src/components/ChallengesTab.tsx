import { challenges } from '../data/challenges'

export default function ChallengesTab() {
  return (
    <>
      <div className="s-title">COUPLE CHALLENGES</div>
      <p className="s-sub">
        All challenges are scored on <strong style={{ color: 'var(--accent)' }}>relative improvement</strong> —
        your personal best is your baseline. Whether you do 1 rep or 30, what matters is how much YOU improve.
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
                <div className="fair-title">⚖️ How It's Made Fair</div>
                <div className="fair-row">
                  <div className="fair-him">
                    <div className="fair-label">Him</div>
                    <div className="fair-val">{c.him}</div>
                  </div>
                  <div className="fair-her">
                    <div className="fair-label">Her</div>
                    <div className="fair-val">{c.her}</div>
                  </div>
                </div>
                <div className="win-rule">🏆 Win condition: <span>{c.winRule}</span></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
