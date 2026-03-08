export const SDRS = [
  { name: 'Ben',     color: '#3b82f6', bg: '#dbeafe' },
  { name: 'Kiye',    color: '#7c3aed', bg: '#ede9fe' },
  { name: 'Warwick', color: '#059669', bg: '#d1fae5' },
  { name: 'Gayatri', color: '#d97706', bg: '#fef3c7' },
]

export const MEDALS = ['🥇', '🥈', '🥉', '🏅']

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
