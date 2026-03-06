/**
 * Vercel serverless function: /api/cards
 * Proxies Notion API requests server-side so the API key is never exposed.
 *
 * Required env var: NOTION_API_KEY
 * The database ID is hardcoded here — safe to commit.
 */

const DATABASE_ID = '2aa9233c420180eabb72e9aad7c9f159'
const NOTION_VERSION = '2022-06-28'

async function queryNotionDatabase(apiKey, databaseId, startCursor = undefined) {
  const body = {
    page_size: 100,
    ...(startCursor ? { start_cursor: startCursor } : {}),
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion API error ${res.status}: ${text}`)
  }

  return res.json()
}

function extractText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return ''
  return richTextArray.map(rt => rt.plain_text || '').join('')
}

function parseCard(page) {
  const props = page.properties || {}

  const question =
    extractText(props.Question?.title) ||
    extractText(props.Name?.title) ||
    ''

  const answer =
    extractText(props.Answer?.rich_text) ||
    ''

  const type =
    props.Type?.select?.name || null

  const pipelineStages =
    (props['Pipeline Stage']?.multi_select || []).map(o => o.name)

  return {
    id: page.id,
    question,
    answer,
    type,
    pipelineStages,
  }
}

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'NOTION_API_KEY env var not set' })
  }

  try {
    let cards = []
    let cursor = undefined
    let hasMore = true

    // Paginate through all results
    while (hasMore) {
      const data = await queryNotionDatabase(apiKey, DATABASE_ID, cursor)
      const parsed = data.results
        .filter(page => page.object === 'page')
        .map(parseCard)
        .filter(c => c.question && c.answer) // only include cards with both Q + A

      cards = cards.concat(parsed)
      hasMore = data.has_more
      cursor = data.next_cursor
    }

    res.status(200).json({ cards, total: cards.length })
  } catch (err) {
    console.error('Notion fetch error:', err)
    res.status(500).json({ error: err.message })
  }
}
