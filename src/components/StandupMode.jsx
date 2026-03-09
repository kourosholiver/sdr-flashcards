import { useState, useCallback, useEffect } from 'react'
import { SDRS, shuffle } from '../data/sdrs'
import FlashCard from './FlashCard'
import Leaderboard from './Leaderboard'
import StandupIntro from './StandupIntro'
import { playCorrect, playIncorrect } from '../utils/gameAudio'
import './StandupMode.css'

const CACHE_KEY  = 'sdr-standup-stats'   // localStorage cache
const PHASE      = { IDLE: 'idle', QUESTION: 'question', ANSWER: 'answer' }

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}
function saveCache(allTime) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(allTime)) } catch {}
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export default function StandupMode({ cards }) {
  const [introShown,  setIntroShown]  = useState(false)
  const [phase,       setPhase]       = useState(PHASE.IDLE)
  const [currentCard, setCurrentCard] = useState(null)
  const [currentSDR,  setCurrentSDR]  = useState(null)
  const [isFlipped,   setIsFlipped]   = useState(false)
  const [lastResult,  setLastResult]  = useState(null)

  // Stats — allTime is the source of truth for the leaderboard
  const [allTimeStats,   setAllTimeStats]   = useState(loadCache)
  const [monthlyStats,   setMonthlyStats]   = useState({})
  const [monthlyHistory, setMonthlyHistory] = useState({})
  const [statsLoading,   setStatsLoading]   = useState(true)

  // Shuffled queues
  const [cardQueue, setCardQueue] = useState([])
  const [sdrQueue,  setSdrQueue]  = useState([])

  // ── Load stats from API on mount ──────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/stats')
      .then(({ allTime, monthly, monthlyHistory: history }) => {
        setAllTimeStats(allTime   || {})
        setMonthlyStats(monthly   || {})
        setMonthlyHistory(history || {})
        saveCache(allTime || {})
      })
      .catch(() => {
        // API unavailable — silently fall back to cached localStorage data
      })
      .finally(() => setStatsLoading(false))
  }, [])

  // ── Queue management ──────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    const sq = sdrQueue.length  > 0 ? sdrQueue  : shuffle(SDRS)
    setCurrentCard(cq[0]); setCardQueue(cq.slice(1))
    setCurrentSDR(sq[0]);  setSdrQueue(sq.slice(1))
    setIsFlipped(false); setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue, sdrQueue])

  const handleIntroStart = useCallback(() => {
    setIntroShown(true)
    nextQuestion()
  }, [nextQuestion])

  const handleSkipSameSDR = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    setCurrentCard(cq[0]); setCardQueue(cq.slice(1))
    setIsFlipped(false); setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue])

  const handleSkip = useCallback(() => {
    const cq = cardQueue.length > 0 ? cardQueue : shuffle(cards)
    const sq = sdrQueue.length  > 0 ? sdrQueue  : shuffle(SDRS)
    setCurrentCard(cq[0]); setCardQueue(cq.slice(1))
    setCurrentSDR(sq[0]);  setSdrQueue(sq.slice(1))
    setIsFlipped(false); setLastResult(null)
    setPhase(PHASE.QUESTION)
  }, [cards, cardQueue, sdrQueue])

  const handleFlip = () => {
    if (phase !== PHASE.QUESTION) return
    setIsFlipped(true); setPhase(PHASE.ANSWER)
  }

  // ── Mark correct / incorrect ──────────────────────────────────────────────
  const handleMark = (correct) => {
    correct ? playCorrect() : playIncorrect()
    const name = currentSDR.name

    // Optimistic local update
    const bump = (prev) => {
      const s = prev[name] || { correct: 0, incorrect: 0 }
      return { ...prev, [name]: { correct: s.correct + (correct ? 1 : 0), incorrect: s.incorrect + (correct ? 0 : 1) } }
    }
    setAllTimeStats(prev => { const n = bump(prev); saveCache(n); return n })
    setMonthlyStats(bump)

    // Persist to database (fire-and-forget — optimistic update already applied)
    apiFetch('/api/stats', {
      method: 'POST',
      body: JSON.stringify({ sdr_name: name, correct }),
    }).catch(() => {
      // If API fails, data is still safe in localStorage cache
    })

    setLastResult(correct ? 'correct' : 'incorrect')
    setTimeout(() => {
      setPhase(PHASE.IDLE)
      setCurrentCard(null); setCurrentSDR(null)
      setIsFlipped(false);  setLastResult(null)
    }, 900)
  }

  if (!introShown) return <StandupIntro onStart={handleIntroStart} />

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

            <FlashCard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />

            {phase === PHASE.ANSWER && (
              <div className="mark-buttons">
                <button className="mark-btn mark-btn--correct"   onClick={() => handleMark(true)}>✓ Correct</button>
                <button className="mark-btn mark-btn--incorrect" onClick={() => handleMark(false)}>✗ Incorrect</button>
              </div>
            )}

            <div className="skip-btns">
              <button className="skip-btn" onClick={handleSkipSameSDR}>Skip question</button>
              <span className="skip-divider">·</span>
              <button className="skip-btn" onClick={handleSkip}>Next person →</button>
            </div>
          </>
        )}
      </div>

      {/* ── LEADERBOARD ── */}
      <Leaderboard
        allTimeStats={allTimeStats}
        monthlyStats={monthlyStats}
        monthlyHistory={monthlyHistory}
        loading={statsLoading}
      />
    </div>
  )
}
