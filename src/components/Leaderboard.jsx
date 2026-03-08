import { SDRS, MEDALS } from '../data/sdrs'
import './Leaderboard.css'

export default function Leaderboard({ stats, onReset }) {
  const rows = SDRS
    .map(sdr => {
      const s = stats[sdr.name] || { correct: 0, incorrect: 0 }
      const total = s.correct + s.incorrect
      const pct = total > 0 ? Math.round((s.correct / total) * 100) : null
      return { ...sdr, correct: s.correct, incorrect: s.incorrect, total, pct }
    })
    .sort((a, b) => b.correct - a.correct || (b.pct ?? -1) - (a.pct ?? -1))

  const maxCorrect = Math.max(...rows.map(r => r.correct), 1)
  const totalAnswered = rows.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <div>
          <h2 className="lb-title">Leaderboard</h2>
          {totalAnswered > 0 && (
            <p className="lb-subtitle">{totalAnswered} questions answered all time</p>
          )}
        </div>
        <button className="btn-ghost" onClick={onReset}>Reset</button>
      </div>

      <div className="lb-rows">
        {rows.map((row, i) => (
          <div key={row.name} className="lb-row">
            <div className="lb-row-top">
              <span className="lb-medal">{MEDALS[i]}</span>
              <span className="lb-name" style={{ color: row.color }}>{row.name}</span>
              <div className="lb-numbers">
                <span className="lb-correct-count">{row.correct}</span>
                <span className="lb-separator">/</span>
                <span className="lb-total-count">{row.total}</span>
                {row.pct !== null && (
                  <span className="lb-pct" style={{ color: row.color }}>{row.pct}%</span>
                )}
              </div>
            </div>
            <div className="lb-bar-track">
              <div
                className="lb-bar-fill"
                style={{
                  width: row.total > 0 ? `${(row.correct / maxCorrect) * 100}%` : '0%',
                  background: row.color,
                }}
              />
              {row.incorrect > 0 && (
                <div
                  className="lb-bar-fill lb-bar-fill--incorrect"
                  style={{
                    width: `${(row.incorrect / maxCorrect) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="lb-row-stats">
              <span style={{ color: '#16a34a' }}>✓ {row.correct} correct</span>
              <span style={{ color: '#dc2626' }}>✗ {row.incorrect} incorrect</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
