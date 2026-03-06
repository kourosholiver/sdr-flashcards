/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality grades:
 *   0 = Blackout  (complete blank)
 *   1 = Hard      (wrong, but recognised answer)
 *   3 = Good      (correct with effort)
 *   5 = Easy      (perfect recall)
 */

export const RATINGS = [
  { label: 'Blackout', quality: 0, color: '#ef4444', bg: '#fef2f2', description: 'Complete blank' },
  { label: 'Hard',     quality: 1, color: '#f97316', bg: '#fff7ed', description: 'Got it wrong' },
  { label: 'Good',     quality: 3, color: '#3b82f6', bg: '#eff6ff', description: 'Correct with effort' },
  { label: 'Easy',     quality: 5, color: '#22c55e', bg: '#f0fdf4', description: 'Perfect recall' },
]

export const DEFAULT_STATE = {
  interval: 1,       // days until next review
  repetitions: 0,    // consecutive correct answers
  easeFactor: 2.5,   // multiplier (min 1.3)
  nextDue: Date.now(), // timestamp
}

/**
 * Apply SM-2 to a card state given a quality score.
 * Returns new state object.
 */
export function applyRating(state = DEFAULT_STATE, quality) {
  let { interval, repetitions, easeFactor } = state

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextDue = Date.now() + interval * 24 * 60 * 60 * 1000

  return { interval, repetitions, easeFactor, nextDue }
}

/**
 * Build a practice queue from cards + persisted SM-2 state.
 * Due cards first (sorted by most overdue), then upcoming.
 */
export function buildQueue(cards, sm2State) {
  const now = Date.now()

  const withState = cards.map(card => ({
    card,
    state: sm2State[card.id] || { ...DEFAULT_STATE },
  }))

  const due = withState
    .filter(({ state }) => state.nextDue <= now)
    .sort((a, b) => a.state.nextDue - b.state.nextDue)

  const upcoming = withState
    .filter(({ state }) => state.nextDue > now)
    .sort((a, b) => a.state.nextDue - b.state.nextDue)

  // Always show at least all due cards; if none due, show everything
  const queue = due.length > 0 ? [...due, ...upcoming] : withState

  return queue.map(({ card }) => card)
}

/**
 * How many cards are currently due.
 */
export function dueCount(cards, sm2State) {
  const now = Date.now()
  return cards.filter(card => {
    const state = sm2State[card.id]
    return !state || state.nextDue <= now
  }).length
}
