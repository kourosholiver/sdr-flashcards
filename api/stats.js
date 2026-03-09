const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_ANON_KEY

function sb(path, init = {}) {
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  }
  // Only send Prefer header on writes
  if (init.method && init.method !== 'GET') {
    headers['Prefer'] = 'return=minimal'
  }
  return fetch(`${SB_URL}/rest/v1${path}`, { ...init, headers })
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // If env vars aren't configured yet, return empty data gracefully
  if (!SB_URL || !SB_KEY) {
    if (req.method === 'GET') return res.json({ allTime: {}, monthly: {}, monthlyHistory: {} })
    return res.json({ ok: true, warning: 'No database configured' })
  }

  try {
    // ── GET — return aggregated stats ────────────────────────────────────────
    if (req.method === 'GET') {
      const r = await sb('/quiz_scores?select=sdr_name,correct,created_at&order=created_at.asc')
      if (!r.ok) {
        const text = await r.text()
        return res.status(500).json({ error: text })
      }

      const rows = await r.json()
      const now = new Date()
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const allTime        = {}
      const monthly        = {}
      const monthlyHistory = {}

      for (const row of rows) {
        const name  = row.sdr_name
        const month = (row.created_at || '').slice(0, 7)

        if (!allTime[name]) allTime[name] = { correct: 0, incorrect: 0 }
        row.correct ? allTime[name].correct++ : allTime[name].incorrect++

        if (!monthlyHistory[month]) monthlyHistory[month] = {}
        if (!monthlyHistory[month][name]) monthlyHistory[month][name] = { correct: 0, incorrect: 0 }
        row.correct ? monthlyHistory[month][name].correct++ : monthlyHistory[month][name].incorrect++

        if (month === thisMonth) {
          if (!monthly[name]) monthly[name] = { correct: 0, incorrect: 0 }
          row.correct ? monthly[name].correct++ : monthly[name].incorrect++
        }
      }

      return res.json({ allTime, monthly, monthlyHistory })
    }

    // ── POST — record a result ───────────────────────────────────────────────
    if (req.method === 'POST') {
      const { sdr_name, correct } = req.body || {}
      if (!sdr_name) return res.status(400).json({ error: 'sdr_name required' })

      const r = await sb('/quiz_scores', {
        method: 'POST',
        body: JSON.stringify({ sdr_name, correct: !!correct }),
      })
      if (!r.ok) {
        const text = await r.text()
        return res.status(500).json({ error: text })
      }
      return res.json({ ok: true })
    }

    res.status(405).end()

  } catch (err) {
    console.error('Stats API error:', err)
    // Return empty data rather than crashing — app still works
    if (req.method === 'GET') return res.json({ allTime: {}, monthly: {}, monthlyHistory: {} })
    return res.status(500).json({ error: err.message })
  }
}
