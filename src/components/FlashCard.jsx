import { useState, useEffect } from 'react'
import { getTypeMeta } from '../utils/notion'
import './FlashCard.css'

export default function FlashCard({ card, onFlip, isFlipped }) {
  const meta = getTypeMeta(card?.type)

  // Reset inner flip state when card changes
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(false)
    const t = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(t)
  }, [card?.id])

  if (!card) return null

  return (
    <div className={`card-scene ${animate ? 'card-scene--ready' : ''}`}>
      <div
        className={`card-inner ${isFlipped ? 'card-inner--flipped' : ''}`}
        onClick={() => !isFlipped && onFlip()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onFlip() : null}
        aria-label={isFlipped ? 'Answer side' : 'Click to reveal answer'}
      >
        {/* FRONT */}
        <div className="card-face card-face--front">
          <div className="card-badge" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </div>
          <p className="card-question">{card.question}</p>
          <span className="card-hint">tap to reveal</span>
        </div>

        {/* BACK */}
        <div className="card-face card-face--back">
          <div className="card-badge" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </div>
          <p className="card-question card-question--sm">{card.question}</p>
          <div className="card-divider" />
          <div className="card-answer-wrap">
            <p className="card-answer">{card.answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
