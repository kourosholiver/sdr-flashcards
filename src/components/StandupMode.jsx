import { useState, useCallback } from 'react'
import { SDRS, shuffle } from '../data/sdrs'
import FlashCard from './FlashCard'
import Leaderboard from './Leaderboard'
import StandupIntro from './StandupIntro'
import { playCorrect, playIncorrect } from '../utils/gameAudio'
import './StandupMode.css'

const STANDUP_KEY = 'sdr-standup-stats'

const PHASE = { IDLE: 'idle', QUESTION: 'question', ANSWER: 'answer' }

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STANDUP_KEY)) || {} }
  catch { return {} }
}
function saveStats(s) { localStorage.setItem(STANDUP_KEY, JSON.stringify(s)) }

export default function StandupMode({ cards }) {
  const [introShown, setIntroShown] = useState(false)
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [currentCard, setCurrentCard] = useState(null)
  const [currentSDR, setCurrentSDR] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState(loadStats)
  const [lastResult, setLastResult] = useState(null) // 'correct' | 'incorrect'

  // Shuffled queues — refill when empty so everyone gets equal turns
  const [cardQueue, setCardQueue] = useState([])
  const [sdrQueue, setSdrQueue] = useState([])

  const nextQuestion = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    const sq = sdrQueue.length > 0 ? sdrQueue : shuffle(SDRS)
    setCurrentCard(cq[0])
    setCurrentSDR(sq[0])
    setCardQueue(cq.slice(1))
    setSdrQueue(sq.slice(1))
    setIsFlipped(false)
    setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue, sdrQueue])

  const handleIntroStart = useCallback(() => {
    setIntroShown(true)
    nextQuestion()
  }, [nextQuestion])

  const handleSkipSameSDR = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    setCurrentCard(cq[0])
    setCardQueue(cq.slice(1))
    setIsFlipped(false)
    setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue])

  const handleSkip = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    const sq = sdrQueue.length > 0 ? sdrQueue : shuffle(SDRS)
    setCurrentCard(cq[0])
    setCurrentSDR(sq[0])
    setCardQueue(cq.slice(1))
    setSdrQueue(sq.slice(1))
    setIsFlipped(false)
    setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue, sdrQueue])

  const handleFlip = () => {
    if (phase !== PHASE.QUESTION) return
    setIsFlipped(true)
    setPhase(PHASE.ANSWER)
  }

  const handleMark = (correct) => {
    correct ? playCorrect() : playIncorrect()
    const name = currentSDR.name
    const prev = stats[name] || { correct: 0, incorrect: 0 }
    const newStats = {
      ...stats,
      [name]: {
        correct:   prev.correct   + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      },
    }
    setStats(newStats)
    saveStats(newStats)
    setLastResult(correct ? 'correct' : 'incorrect')
    setTimeout(() => {
      setPhase(PHASE.IDLE)
      setCurrentCard(null)
      setCurrentSDR(null)
      setIsFlipped(false)
      setLastResult(null)
    }, 900)
  }

  const handleReset = () => {
    if (!window.confirm('Reset all leaderboard stats? This cannot be undone.')) return
    setStats({})
    saveStats({})
  }

  // Show intro screen until the big button is pressed
  if (!introShown) {
    return <StandupIntro onStart={handleIntroStart} />
  }

  return (
    <div className="standup">
      {/* ── CARD AREA ── */}
      <div className="standup-card-area">
        {phase === PHASE.IDLE && !lastResult && (
          <button className="next-btn" onClick={nextQuestion}>
            <span className="next-btn-icon">▶</span>
            Next Question
          </button>
        )}

        {lastResult && (
          <div className={`result-flash result-flash--${lastResult}`}>
            {lastResult === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
          </div>
        )}

        {(phase === PHASE.QUESTION || phase === PHASE.ANSWER) && currentSDR && (
          <>
            <div
              className="sdr-spotlight"
              style={{ color: currentSDR.color, background: currentSDR.bg, borderColor: currentSDR.color + '55' }}
            >
              {currentSDR.avatar && (
                <img src={currentSDR.avatar} alt={currentSDR.name} className="sdr-spotlight-avatar" />
              )}
              <span className="sdr-spotlight-name">{currentSDR.name}</span>
              <span className="sdr-spotlight-tag">your turn</span>
            </div>

            <FlashCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />

            {phase === PHASE.ANSWER && (
              <div className="mark-buttons">
                <button className="mark-btn mark-btn--correct" onClick={() => handleMark(true)}>
                  ✓ Correct
                </button>
                <button className="mark-btn mark-btn--incorrect" onClick={() => handleMark(false)}>
                  ✗ Incorrect
                </button>
              </div>
            )}

            <div className="skip-btns">
              <button className="skip-btn" onClick={handleSkipSameSDR}>
                Skip question
              </button>
              <span className="skip-divider">·</span>
              <button className="skip-btn" onClick={handleSkip}>
                Next person →
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── LEADERBOARD ── */}
      <Leaderboard stats={stats} onReset={handleReset} />
    </div>
  )
}
