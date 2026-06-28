export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt manquant' })
    }

    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/facebook/musicgen-small',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
        signal: AbortSignal.timeout(55000),
      }
    )

    const contentType = hfRes.headers.get('content-type') || ''

    if (!hfRes.ok) {
      const errorText = await hfRes.text()
      throw new Error(errorText || `HF erreur ${hfRes.status}`)
    }

    const arrayBuffer = await hfRes.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return res.status(200).json({
      audio_base64: base64,
      mime_type: contentType || 'audio/wav',
    })
  } catch (e) {
    console.error('Generate error:', e)
    return res.status(500).json({
      error: e.message || 'Erreur génération',
    })
  }
}
