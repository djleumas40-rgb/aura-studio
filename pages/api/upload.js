export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { filename, mimetype, data } = req.body
    if (!data) return res.status(400).json({ error: 'Aucun fichier reçu' })

    const buffer = Buffer.from(data, 'base64')
    const blob = new Blob([buffer], { type: mimetype || 'audio/mpeg' })
    const fd = new FormData()
    fd.append('file', blob, filename || 'audio.mp3')

    const uploadRes = await fetch('https://api.mureka.ai/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MUREKA_API_KEY}` },
      body: fd,
    })

    const uploadData = await uploadRes.json()
    if (!uploadRes.ok)
      throw new Error(uploadData.error?.message || 'Upload Mureka échoué')

    res.status(200).json({ file_id: uploadData.id, filename })
  } catch (e) {
    console.error('Upload error:', e)
    res.status(500).json({ error: e.message })
  }
}
