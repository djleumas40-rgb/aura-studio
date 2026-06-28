export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { filename } = req.body

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `Tu es un expert en création de prompts musicaux pour Mureka AI. Génère une analyse créative basée sur le nom du fichier. Réponds UNIQUEMENT en JSON sans backticks:
{
  "mood": "un mot parmi: energetic, melancholic, dark, dreamy, chill, epic",
  "titre": "titre poétique",
  "ambiance": "2 phrases d'ambiance",
  "genre": "genre musical",
  "instruments": ["3-4 instruments"],
  "bpm": "plage ex: 90-110",
  "prompt_mureka": "prompt anglais 60-80 mots pour Mureka, style musical inspiré, original",
  "tags": ["tag1","tag2","tag3","tag4"]
}`,
        messages: [{ role: 'user', content: `Fichier audio: "${filename}". Génère une analyse musicale créative et un prompt Mureka inspirant.` }]
      })
    })

    const data = await claudeRes.json()
    const raw = data.content?.map(b => b.text || '').join('') || ''
    const analysis = JSON.parse(raw.replace(/```json|```/gi, '').trim())
    res.status(200).json({ analysis })
  } catch (e) {
    console.error('Describe error:', e)
    res.status(500).json({ error: e.message })
  }
}
