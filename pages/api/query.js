export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { task_id } = req.query
  if (!task_id) return res.status(400).json({ error: 'task_id manquant' })

  try {
    const queryRes = await fetch(`https://api.mureka.ai/v1/song/query/${task_id}`, {
      headers: { Authorization: `Bearer ${process.env.MUREKA_API_KEY}` },
    })

    const data = await queryRes.json()
    if (!queryRes.ok) throw new Error(data.error?.message || 'Query échouée')

    // Mureka returns songs array when done
    const songs = data.songs || data.results || []
    const status = data.status // 'preparing' | 'running' | 'succeeded' | 'failed'

    res.status(200).json({ status, songs, raw: data })
  } catch (e) {
    console.error('Query error:', e)
    res.status(500).json({ error: e.message })
  }
}
