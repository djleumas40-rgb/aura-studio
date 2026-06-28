export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' })

  try {
    // MusicGen via Replicate - 100% gratuit avec crédits offerts
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
        input: {
          prompt: prompt,
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak',
          duration: 30,
        },
      }),
    })

    const startData = await startRes.json()
    if (!startRes.ok) throw new Error(startData.detail || 'Replicate génération échouée')

    res.status(200).json({ task_id: startData.id, status: startData.status })
  } catch (e) {
    console.error('Generate error:', e)
    res.status(500).json({ error: e.message })
  }
}
