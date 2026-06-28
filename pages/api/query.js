export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { task_id } = req.query

  // Hugging Face retourne directement le résultat
  // donc on retourne toujours succeeded
  res.status(200).json({
    status: 'succeeded',
    songs: []
  })
}
