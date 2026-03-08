import { useState, useEffect, useCallback, useMemo } from 'react'
import FlashCard from './components/FlashCard'
import CategoryFilter from './components/CategoryFilter'
import RatingButtons from './components/RatingButtons'
import StandupMode from './components/StandupMode'
import AnswerPractice from './components/AnswerPractice'
import { fetchCards } from './utils/notion'
import { applyRating, buildQueue, dueCount, DEFAULT_STATE } from './utils/sm2'
import './App.css'

const SM2_STORAGE_KEY = 'sdr-sm2-state'

function loadSm2State() {
  try {
    return JSON.parse(localStorage.getItem(SM2_STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveSm2State(state) {
  localStorage.setItem(SM2_STORAGE_KEY, JSON.stringify(state))
}

export default function App() {
  const [allCards, setAllCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('study')          // 'standup' | 'study'
  const [studyMode, setStudyMode] = useState('review') // 'review' | 'practice'

  const [sm2State, setSm2State] = useState(loadSm2State)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStats, setSessionStats] = useState({ rated: 0 })

  useEffect(() => {
    fetchCards()
      .then(({ cards }) => {
        setAllCards(cards)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => {
    const types = [...new Set(allCards.map(c => c.type).filter(Boolean))]
    return types.sort()
  }, [allCards])

  const counts = useMemo(() => {
    const result = { All: dueCount(allCards, sm2State) }
    categories.forEach(cat => {
      const filtered = allCards.filter(c => c.type === cat)
      result[cat] = dueCount(filtered, sm2State)
    })
    return result
  }, [allCards, categories, sm2State])

  const startSession = useCallback((category, cards, sm2) => {
    const filtered = category === 'All' ? cards : cards.filter(c => c.type === category)
    const q = buildQueue(filtered, sm2)
    setQueue(q)
    setCurrentIndex(0)
    setIsFlipped(false)
    setSessionComplete(false)
    setSessionStats({ rated: 0 })
  }, [])

  useEffect(() => {
    if (allCards.length > 0) {
      startSession(selectedCategory, allCards, sm2State)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, selectedCategory])

  const handleFlip = () => setIsFlipped(true)

  const handleRate = (quality) => {
    const card = queue[currentIndex]
    if (!card) return
    const prevState = sm2State[card.id] || { ...DEFAULT_STATE }
    const newCardState = applyRating(prevState, quality)
    const newSm2 = { ...sm2State, [card.id]: newCardState }
    setSm2State(newSm2)
    saveSm2State(newSm2)
    const nextIndex = currentIndex + 1
    setSessionStats(s => ({ ...s, rated: s.rated + 1 }))
    if (nextIndex >= queue.length) {
      setSessionComplete(true)
    } else {
      setCurrentIndex(nextIndex)
      setIsFlipped(false)
    }
  }

  const handleResetProgress = () => {
    if (!window.confirm('Reset all spaced repetition progress? This cannot be undone.')) return
    setSm2State({})
    saveSm2State({})
    startSession(selectedCategory, allCards, {})
  }

  const currentCard = queue[currentIndex]
  const totalInQueue = queue.length
  const dueInQueue = dueCount(
    selectedCategory === 'All' ? allCards : allCards.filter(c => c.type === selectedCategory),
    sm2State
  )

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading flashcards…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Could not load cards</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="app-title">SDR Flashcards</h1>
            <p className="app-subtitle">Nomio Sales Practice</p>
          </div>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'standup' ? 'mode-btn--active' : ''}`}
              onClick={() => setMode('standup')}
            >
              Standup
            </button>
            <button
              className={`mode-btn ${mode === 'study' ? 'mode-btn--active' : ''}`}
              onClick={() => setMode('study')}
            >
              Self Study
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {mode === 'standup' ? (
          <StandupMode cards={allCards} />
        ) : (
          <>
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
              counts={counts}
            />

              <div className="study-mode-toggle">
              <button
                className={`study-mode-btn ${studyMode === 'review' ? 'study-mode-btn--active' : ''}`}
                onClick={() => setStudyMode('review')}
              >
                Review cards
              </button>
              <button
                className={`study-mode-btn ${studyMode === 'practice' ? 'study-mode-btn--active' : ''}`}
                onClick={() => setStudyMode('practice')}
              >
                Practice answers
              </button>
            </div>

          {sessionComplete ? (
              <div className="session-complete">
                <div className="complete-icon">🎉</div>
                <h2>Session complete!</h2>
                <p>You rated {sessionStats.rated} card{sessionStats.rated !== 1 ? 's' : ''}.</p>
                <p className="complete-sub">Cards you found hard will appear again sooner.</p>
                <div className="complete-actions">
                  <button className="btn-primary" onClick={() => startSession(selectedCategory, allCards, sm2State)}>
                    Practice again
                  </button>
                  <button className="btn-ghost" onClick={handleResetProgress}>Reset progress</button>
                </div>
              </div>
            ) : totalInQueue === 0 ? (
              <div className="session-complete">
                <div className="complete-icon">📭</div>
                <h2>No cards found</h2>
                <p>There are no cards in this category yet.</p>
              </div>
            ) : (
              <>
                <div className="progress-bar-wrap">
                  <div className="progress-meta">
                    <span>Card {currentIndex + 1} of {totalInQueue}</span>
                    {dueInQueue > 0 && (
                      <span className="progress-due">{dueInQueue} due today</span>
                    )}
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${(currentIndex / totalInQueue) * 100}%` }}
                    />
                  </div>
                </div>

                {studyMode === 'practice' ? (
                  <AnswerPractice card={currentCard} onRate={handleRate} />
                ) : (
                  <>
                    <FlashCard
                      card={currentCard}
                      isFlipped={isFlipped}
                      onFlip={handleFlip}
                    />
                    {isFlipped && <RatingButtons onRate={handleRate} />}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
