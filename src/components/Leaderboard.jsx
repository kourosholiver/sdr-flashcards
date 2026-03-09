import { useState } from 'react'
import { SDRS, MEDALS } from '../data/sdrs'
import './Leaderboard.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
}

function thisMonthKey() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function buildRows(stats) {
  return SDRS
    .map(sdr => {
      const s     = stats[sdr.name] || { correct: 0, incorrect: 0 }
      const total = s.correct + s.incorrect
      const pct   = total > 0 ? Math.round((s.correct / total) * 100) : null
      return { ...sdr, correct: s.correct, incorrect: s.incorrect, total, pct }
    })
    .sort((a, b) => b.correct - a.correct || (b.pct ?? -1) - (a.pct ?? -1))
}

function LeaderRows({ stats }) {
  const rows       = buildRows(stats)
  const maxCorrect = Math.max(...rows.map(r => r.correct), 1)
  const total      = rows.reduce((s, r) => s + r.total, 0)

  if (total === 0) {
    return <p className="lb-empty">No answers recorded yet.</p>
  }

  return (
    <div className="lb-rows">
      {rows.map((row, i) => (
        <div key={row.name} className="lb-row">
          <div className="lb-row-top">
            <span className="lb-medal">{MEDALS[i]}</span>
            {row.avatar && (
              <img src={row.avatar} alt={row.name} className="lb-avatar" />
            )}
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
              style={{ width: `${(row.correct / maxCorrect) * 100}%`, background: row.color }}
            />
            {row.incorrect > 0 && (
              <div
                className="lb-bar-fill lb-bar-fill--incorrect"
                style={{ width: `${(row.incorrect / maxCorrect) * 100}%` }}
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
  )
}

export default function Leaderboard({ allTimeStats, monthlyStats, monthlyHistory, loading }) {
  const [tab, setTab] = useState('month')

  const curMonth   = thisMonthKey()
  const pastMonths = Object.keys(monthlyHistory || {})
    .filter(k => k !== curMonth)
    .sort()
    .reverse()
    .slice(0, 6)

  const allTimeTotal = Object.values(allTimeStats || {})
    .reduce((s, v) => s + v.correct + v.incorrect, 0)

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <div>
          <h2 className="lb-title">Leaderboard</h2>
          {allTimeTotal > 0 && (
            <p className="lb-subtitle">{allTimeTotal} questions answered all time</p>
          )}
        </div>
        {loading && <span className="lb-syncing">syncing…</span>}
      </div>

      {/* Tabs */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${tab === 'month' ? 'lb-tab--active' : ''}`}
          onClick={() => setTab('month')}
        >This Month</button>
        <button
          className={`lb-tab ${tab === 'alltime' ? 'lb-tab--active' : ''}`}
          onClick={() => setTab('alltime')}
        >All Time</button>
        {pastMonths.length > 0 && (
          <button
            className={`lb-tab ${tab === 'history' ? 'lb-tab--active' : ''}`}
            onClick={() => setTab('history')}
          >Past Months</button>
        )}
      </div>

      {tab === 'month' && (
        <>
          <p className="lb-period">{monthLabel(curMonth)}</p>
          <LeaderRows stats={monthlyStats || {}} />
        </>
      )}

      {tab === 'alltime' && <LeaderRows stats={allTimeStats || {}} />}

      {tab === 'history' && (
        <div className="lb-history">
          {pastMonths.length === 0 && <p className="lb-empty">No past months yet.</p>}
          {pastMonths.map(month => {
            const rows   = buildRows(monthlyHistory[month] || {})
            const winner = rows.find(r => r.total > 0)
            if (!winner) return null
            return (
              <div key={month} className="lb-history-month">
                <div className="lb-history-header">
                  <span className="lb-history-label">{monthLabel(month)}</span>
                  <div className="lb-history-winner" style={{ color: winner.color }}>
                    🏆 {winner.name}
                    {winner.pct !== null && <span className="lb-history-pct"> {winner.pct}%</span>}
                  </div>
                </div>
                <div className="lb-history-rows">
                  {rows.filter(r => r.total > 0).map((row, i) => (
                    <div key={row.name} className="lb-history-row">
                      <span className="lb-history-pos">{MEDALS[i]}</span>
                      {row.avatar && (
                        <img src={row.avatar} alt={row.name} className="lb-history-avatar" />
                      )}
                      <span className="lb-history-name" style={{ color: row.color }}>{row.name}</span>
                      <span className="lb-history-score">
                        {row.correct}/{row.total}
                        {row.pct !== null && <span style={{ color: row.color }}> {row.pct}%</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
