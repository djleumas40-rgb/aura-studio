export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { filename } = req.body
    if (!filename) return res.status(400).json({ error: 'Aucun fichier reçu' })

    // On retourne un fake file_id basé sur le nom
    // L'analyse se fera par Claude directement sans upload Mureka
    res.status(200).json({ file_id: null, filename })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
