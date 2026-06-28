export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { task_id } = req.query
  if (!task_id) return res.status(400).json({ error: 'task_id manquant' })

  try {
    const queryRes = await fetch(`https://api.replicate.com/v1/predictions/${task_id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_KEY}` },
    })

    const data = await queryRes.json()
    if (!queryRes.ok) throw new Error(data.detail || 'Query échouée')

    // Replicate statuses: starting | processing | succeeded | failed | canceled
    const status = data.status
    const audioUrl = data.output // Replicate returns direct URL string for audio

    if (status === 'succeeded' && audioUrl) {
      res.status(200).json({
        status: 'succeeded',
        songs: [{ url: audioUrl }]
      })
    } else if (status === 'failed' || status === 'canceled') {
      res.status(200).json({ status: 'failed', songs: [] })
    } else {
      res.status(200).json({ status, songs: [] })
    }
  } catch (e) {
    console.error('Query error:', e)
    res.status(500).json({ error: e.message })
  }
}
