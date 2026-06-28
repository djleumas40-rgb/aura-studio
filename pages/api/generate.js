export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' })

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/musicgen-small',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Génération échouée')
    }

    const audioBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(audioBuffer).toString('base64')

    res.status(200).json({
      task_id: 'hf_done',
      status: 'succeeded',
      audio_base64: base64
    })
  } catch (e) {
    console.error('Generate error:', e)
    res.status(500).json({ error: e.message })
  }
}
