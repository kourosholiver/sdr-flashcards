import { useState, useRef, useEffect } from 'react'
import RatingButtons from './RatingButtons'
import { scoreAnswer, savePracticeScore } from '../utils/scorer'
import './AnswerPractice.css'

const TYPE_COLORS = {
  'Dismissive Objections': { color: '#7c3aed', bg: '#ede9fe' },
  '"Not the right time" Objections': { color: '#d97706', bg: '#fef3c7' },
  '"We\'re Fine" Objections': { color: '#059669', bg: '#d1fae5' },
  'Product Questions': { color: '#2563eb', bg: '#dbeafe' },
  'Competing Priorities': { color: '#dc2626', bg: '#fee2e2' },
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const bg   = score >= 80 ? '#f0fdf4' : score >= 50 ? '#fef3c7' : '#fef2f2'
  const border = score >= 80 ? '#86efac' : score >= 50 ? '#fde68a' : '#fca5a5'
  const label  = score >= 80 ? 'Great answer' : score >= 50 ? 'Getting there' : 'Keep practising'
  return (
    <div className="score-badge" style={{ color, background: bg, borderColor: border }}>
      <span className="score-number">{score}%</span>
      <span className="score-label">{label}</span>
    </div>
  )
}

function HighlightedAnswer({ text, matched, missed }) {
  const parts = text.split(/(\s+)/)
  return (
    <span>
      {parts.map((part, i) => {
        const clean = part.toLowerCase().replace(/[^\w]/g, '')
        if (matched.has(clean)) return <mark key={i} className="hl-matched">{part}</mark>
        if (missed.has(clean))  return <mark key={i} className="hl-missed">{part}</mark>
        return part
      })}
    </span>
  )
}

export default function AnswerPractice({ card, onRate }) {
  const [userAnswer, setUserAnswer] = useState('')
  const [result, setResult] = useState(null) // { score, matched, missed, cardStats }
  const textareaRef = useRef(null)

  // Reset when card changes
  useEffect(() => {
    setUserAnswer('')
    setResult(null)
    textareaRef.current?.focus()
  }, [card?.id])

  const handleScore = () => {
    if (!userAnswer.trim()) return
    const { score, matched, missed } = scoreAnswer(userAnswer, card.answer)
    const cardStats = savePracticeScore(card.id, score)
    setResult({ score, matched, missed, cardStats })
  }

  const handleRate = (quality) => {
    onRate(quality)
    setUserAnswer('')
    setResult(null)
  }

  if (!card) return null

  const meta = TYPE_COLORS[card.type] || { color: '#6b7280', bg: '#f3f4f6' }

  return (
    <div className="ap-wrap">
      {/* Question */}
      <div className="ap-card">
        <span className="ap-type-badge" style={{ color: meta.color, background: meta.bg }}>
          {card.type}
        </span>
        <p className="ap-question">{card.question}</p>
      </div>

      {!result ? (
        /* ── Input phase ── */
        <div className="ap-input-phase">
          <div className="ap-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="ap-textarea"
              placeholder="Type your answer, or click here and use WisprFlow to dictate…"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              rows={5}
            />
            <span className="ap-whispr-hint">
              🎙 WisprFlow: click the box above, then activate WisprFlow to dictate
            </span>
          </div>
          <button
            className="ap-score-btn"
            onClick={handleScore}
            disabled={!userAnswer.trim()}
          >
            Score my answer →
          </button>
        </div>
      ) : (
        /* ── Result phase ── */
        <div className="ap-result-phase">
          <ScoreBadge score={result.score} />

          {result.cardStats.count > 1 && (
            <p className="ap-history">
              Your best: <strong>{result.cardStats.best}%</strong>
              &nbsp;· Attempts: {result.cardStats.count}
            </p>
          )}

          <div className="ap-comparison">
            <div className="ap-col">
              <h4 className="ap-col-title">Your answer</h4>
              <p className="ap-col-text">{userAnswer}</p>
            </div>
            <div className="ap-col">
              <h4 className="ap-col-title">
                Model answer
                <span className="ap-legend">
                  <span className="hl-matched ap-legend-chip">matched</span>
                  <span className="hl-missed ap-legend-chip">missed</span>
                </span>
              </h4>
              <p className="ap-col-text">
                <HighlightedAnswer
                  text={card.answer}
                  matched={result.matched}
                  missed={result.missed}
                />
              </p>
            </div>
          </div>

          <RatingButtons onRate={handleRate} />
        </div>
      )}
    </div>
  )
}
