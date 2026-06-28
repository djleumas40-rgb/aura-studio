export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
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
      }
    )

    const contentType = hfRes.headers.get('content-type') || ''

    if (!hfRes.ok) {
      const errorText = await hfRes.text()
      throw new Error(errorText || 'Erreur Hugging Face')
    }

    if (contentType.includes('audio')) {
      const arrayBuffer = await hfRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', 'attachment; filename="generation.wav"')
      return res.status(200).send(buffer)
    }

    const data = await hfRes.json()
    return res.status(200).json(data)
  } catch (e) {
    console.error('Generate error:', e)
    return res.status(500).json({ error: e.message })
  }
}
