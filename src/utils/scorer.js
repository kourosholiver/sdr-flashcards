const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'its', 'be', 'as', 'are',
  'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'that',
  'this', 'these', 'those', 'i', 'we', 'you', 'they', 'he', 'she',
  'our', 'your', 'their', 'my', 'me', 'us', 'him', 'her', 'not',
  'so', 'if', 'then', 'when', 'what', 'how', 'why', 'just', 'also',
  'about', 'up', 'out', 'into', 'than', 'which', 'who', 'get', 'got',
  'am', 'no', 'yes', 'well', 'like', 'very', 'really', 'let', 'say',
  'said', 'know', 'think', 'see', 'now', 'still', 'even', 'back',
])

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Score a user's answer against a model answer.
 * Returns { score: 0–100, matched: Set<string>, missed: Set<string> }
 */
export function scoreAnswer(userAnswer, modelAnswer) {
  if (!userAnswer.trim()) return { score: 0, matched: new Set(), missed: new Set() }

  const modelTokens = tokenize(modelAnswer)
  const userTokenSet = new Set(tokenize(userAnswer))

  if (modelTokens.length === 0) return { score: 100, matched: new Set(), missed: new Set() }

  const matched = new Set()
  const missed = new Set()
  const seen = new Set()

  for (const token of modelTokens) {
    if (seen.has(token)) continue
    seen.add(token)
    if (userTokenSet.has(token)) {
      matched.add(token)
    } else {
      missed.add(token)
    }
  }

  const score = Math.round((matched.size / (matched.size + missed.size)) * 100)
  return { score, matched, missed }
}

const PRACTICE_KEY = 'sdr-practice-scores'

export function loadPracticeScores() {
  try { return JSON.parse(localStorage.getItem(PRACTICE_KEY)) || {} }
  catch { return {} }
}

export function savePracticeScore(cardId, score) {
  const all = loadPracticeScores()
  const prev = all[cardId] || { best: 0, last: 0, count: 0 }
  all[cardId] = {
    best: Math.max(prev.best, score),
    last: score,
    count: prev.count + 1,
  }
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(all))
  return all[cardId]
}
