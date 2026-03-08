export const SDRS = [
  { name: 'Ben',     color: '#3b82f6', bg: '#dbeafe', avatar: '/avatars/ben.jpg',     title: 'The Closer' },
  { name: 'Kiye',    color: '#7c3aed', bg: '#ede9fe', avatar: '/avatars/kiye.jpg',    title: 'The Smooth Talker' },
  { name: 'Warwick', color: '#059669', bg: '#d1fae5', avatar: '/avatars/warwick.jpg', title: 'The Dark Horse' },
  { name: 'Gayatri', color: '#d97706', bg: '#fef3c7', avatar: '/avatars/gayatri.jpg', title: 'The Wildcard' },
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
