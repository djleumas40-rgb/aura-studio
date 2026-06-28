export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt, model = 'auto' } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' })

  try {
    const generateRes = await fetch('https://api.mureka.ai/v1/song/easy-generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    })

    const data = await generateRes.json()
    if (!generateRes.ok) throw new Error(data.error?.message || 'Génération Mureka échouée')

    res.status(200).json({ task_id: data.id, status: data.status })
  } catch (e) {
    console.error('Generate error:', e)
    res.status(500).json({ error: e.message })
  }
}
