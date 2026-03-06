import staticCards from '../data/cards.json'

/**
 * Returns flashcards from the static JSON bundle.
 *
 * To switch to live Notion API later: comment out the static return and
 * uncomment the fetch block. Set NOTION_API_KEY in your Vercel env vars.
 */
export async function fetchCards() {
  // --- STATIC MODE (no API key needed) ---
  return { cards: staticCards }

  // --- LIVE MODE (requires NOTION_API_KEY in Vercel) ---
  // const res = await fetch('/api/cards')
  // if (!res.ok) {
  //   const err = await res.text()
  //   throw new Error(`Failed to fetch cards: ${err}`)
  // }
  // return res.json()
}

/**
 * Notion Type → display label + colour
 * Keys match the exact strings in cards.json (and the Notion DB).
 */
export const TYPE_META = {
  'Dismissive Objections':           { label: 'Dismissive',           color: '#d97706', bg: '#fffbeb' },
  '"Not the right time" Objections': { label: 'Not the right time',   color: '#6b7280', bg: '#f3f4f6' },
  '"We\'re Fine" Objections':        { label: "We're Fine",           color: '#7c3aed', bg: '#faf5ff' },
  'Product Questions':               { label: 'Product Q',            color: '#ea580c', bg: '#fff7ed' },
  'Competing Priorities':            { label: 'Competing Priorities', color: '#16a34a', bg: '#f0fdf4' },
  'Objection':                       { label: 'Objection',            color: '#db2777', bg: '#fdf2f8' },
  'Pitch':                           { label: 'Pitch',                color: '#dc2626', bg: '#fef2f2' },
  'SDR Customer Story':              { label: 'Customer Story',       color: '#0284c7', bg: '#f0f9ff' },
  'Email Template':                  { label: 'Email Template',       color: '#78716c', bg: '#fafaf9' },
}

export function getTypeMeta(type) {
  return TYPE_META[type] || { label: type || 'General', color: '#6b7280', bg: '#f3f4f6' }
}
