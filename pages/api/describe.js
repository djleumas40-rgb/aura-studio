export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { file_id, filename } = req.body
  if (!file_id) return res.status(400).json({ error: 'file_id manquant' })

  try {
    // Step 1: Mureka describe song
    const describeRes = await fetch('https://api.mureka.ai/v1/song/describe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_id }),
    })

    const describeData = await describeRes.json()
    if (!describeRes.ok) throw new Error(describeData.error?.message || 'Describe Mureka échoué')

    const murekaDescription = describeData.description || describeData.prompt || JSON.stringify(describeData)

    // Step 2: Claude enrichit l'analyse et génère le prompt créatif
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
        system: `Tu es un expert en analyse musicale et création de prompts pour Mureka AI.
À partir de la description Mureka d'une musique, tu génères une analyse enrichie et un prompt créatif pour créer une NOUVELLE composition originale dans le même style — inspirée mais pas copiée.
Réponds UNIQUEMENT en JSON valide sans backticks :
{
  "mood": "un mot parmi: energetic, melancholic, dark, dreamy, chill, epic",
  "titre": "titre poétique pour la nouvelle composition",
  "ambiance": "2 phrases décrivant l'atmosphère",
  "genre": "genre musical principal",
  "instruments": ["3-5 instruments clés"],
  "bpm": "plage ex: 90-100",
  "prompt_mureka": "prompt anglais optimisé pour Mureka easy-generate, 50-80 mots, décrivant la nouvelle composition inspirée du style (PAS une copie)",
  "tags": ["tag1","tag2","tag3","tag4"]
}`,
        messages: [{
          role: 'user',
          content: `Description Mureka de la musique de référence : "${murekaDescription}"\n\nFichier : ${filename || 'unknown'}\n\nGénère l'analyse enrichie et le prompt créatif.`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const raw = claudeData.content?.map(b => b.text || '').join('') || ''
    const clean = raw.replace(/```json|```/gi, '').trim()
    let analysis
    try {
      analysis = JSON.parse(clean)
    } catch {
      analysis = {
        mood: 'chill',
        titre: 'Nouvelle composition',
        ambiance: murekaDescription,
        genre: 'Electronic',
        instruments: ['synth', 'drums', 'bass'],
        bpm: '100-120',
        prompt_mureka: murekaDescription,
        tags: ['electronic', 'ambient']
      }
    }

    res.status(200).json({
      mureka_raw: murekaDescription,
      analysis,
    })
  } catch (e) {
    console.error('Describe error:', e)
    res.status(500).json({ error: e.message })
  }
}
