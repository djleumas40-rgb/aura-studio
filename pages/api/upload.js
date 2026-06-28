import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Erreur lecture fichier: ' + err.message })
    const file = Array.isArray(files.audio) ? files.audio[0] : files.audio
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    try {
      const fileBuffer = fs.readFileSync(file.filepath)
      const fileName = file.originalFilename || 'audio.mp3'
      const mimeType = file.mimetype || 'audio/mpeg'
      const blob = new Blob([fileBuffer], { type: mimeType })
      const fd = new FormData()
      fd.append('file', blob, fileName)
      fd.append('purpose', 'song')
      const uploadRes = await fetch('https://api.mureka.ai/v1/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.MUREKA_API_KEY}` },
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Upload Mureka échoué')
      res.status(200).json({ file_id: uploadData.id, filename: fileName })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
}
