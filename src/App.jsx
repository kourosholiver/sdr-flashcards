import { useState, useEffect, useCallback, useMemo } from 'react'
import FlashCard from './components/FlashCard'
import CategoryFilter from './components/CategoryFilter'
import RatingButtons from './components/RatingButtons'
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

  const [sm2State, setSm2State] = useState(loadSm2State)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStats, setSessionStats] = useState({ rated: 0 })

  // Fetch cards on mount
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

  // Derive available categories
  const categories = useMemo(() => {
    const types = [...new Set(allCards.map(c => c.type).filter(Boolean))]
    return types.sort()
  }, [allCards])

  // Due counts per category for the filter badges
  const counts = useMemo(() => {
    const result = { All: dueCount(allCards, sm2State) }
    categories.forEach(cat => {
      const filtered = allCards.filter(c => c.type === cat)
      result[cat] = dueCount(filtered, sm2State)
    })
    return result
  }, [allCards, categories, sm2State])

  // Rebuild queue when category or cards change
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

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    // startSession will run via the effect above
  }

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

  const handleRestart = () => {
    startSession(selectedCategory, allCards, sm2State)
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
          <button className="btn-ghost" onClick={handleResetProgress} title="Reset all progress">
            Reset
          </button>
        </div>
      </header>

      <main className="app-main">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onChange={handleCategoryChange}
          counts={counts}
        />

        {sessionComplete ? (
          <div className="session-complete">
            <div className="complete-icon">🎉</div>
            <h2>Session complete!</h2>
            <p>You rated {sessionStats.rated} card{sessionStats.rated !== 1 ? 's' : ''}.</p>
            <p className="complete-sub">Cards you found hard will appear again sooner.</p>
            <button className="btn-primary" onClick={handleRestart}>
              Practice again
            </button>
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
                  style={{ width: `${((currentIndex) / totalInQueue) * 100}%` }}
                />
              </div>
            </div>

            <FlashCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />

            {isFlipped && (
              <RatingButtons onRate={handleRate} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
