import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'

const MOODS = {
  energetic:   { p: '#F97316', s: '#FCD34D', g: 'rgba(249,115,22,0.3)'  },
  melancholic: { p: '#6366F1', s: '#A5B4FC', g: 'rgba(99,102,241,0.3)'  },
  dark:        { p: '#7C3AED', s: '#A78BFA', g: 'rgba(124,58,237,0.3)'  },
  dreamy:      { p: '#EC4899', s: '#F0ABFC', g: 'rgba(236,72,153,0.3)'  },
  chill:       { p: '#06B6D4', s: '#67E8F9', g: 'rgba(6,182,212,0.3)'   },
  epic:        { p: '#EF4444', s: '#FCA5A5', g: 'rgba(239,68,68,0.3)'   },
}
const DEFAULT_MOOD = 'dark'

function Waveform({ mood, active }) {
  const ref = useRef(null)
  const raf = useRef(null)
  const t   = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const c = MOODS[mood] || MOODS[DEFAULT_MOOD]

    const draw = () => {
      t.current += active ? 0.03 : 0.008
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bars = 72
      const amp  = active ? 0.82 : 0.22
      for (let i = 0; i < bars; i++) {
        const ph = (i / bars) * Math.PI * 2
        const h  = (Math.sin(t.current * 1.4 + ph) * 0.45 +
                    Math.sin(t.current * 0.8 + ph * 1.5) * 0.3 +
                    Math.sin(t.current * 2.2 + ph * 0.5) * 0.25) * amp + (active ? 0.1 : 0.04)
        const barH = h * H
        const grad = ctx.createLinearGradient(0, H, 0, H - barH)
        grad.addColorStop(0, c.p + 'BB')
        grad.addColorStop(1, c.s + 'FF')
        ctx.fillStyle = grad
        const bw = W / bars
        ctx.beginPath()
        ctx.roundRect(i * bw + bw * 0.12, H - barH, bw * 0.76, barH, [3, 3, 0, 0])
        ctx.fill()
      }
      const gr = ctx.createRadialGradient(W/2, H, 0, W/2, H, W * 0.55)
      gr.addColorStop(0, c.g); gr.addColorStop(1, 'transparent')
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H)
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [mood, active])

  return <canvas ref={ref} width={800} height={110} style={{ width: '100%', height: 110, borderRadius: 12 }} />
}

function Step({ n, label, active, done, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
        background: done ? color + 'CC' : active ? color + '33' : '#1A1A2E',
        border: `2px solid ${done || active ? color : '#2A2A40'}`,
        color: done ? '#fff' : active ? color : '#475569',
        transition: 'all 0.3s', flexShrink: 0,
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 13, color: done ? '#CBD5E1' : active ? '#94A3B8' : '#334155', fontWeight: done || active ? 600 : 400 }}>
        {label}
      </span>
    </div>
  )
}

function SongCard({ song, index, mood }) {
  const c = MOODS[mood] || MOODS[DEFAULT_MOOD]
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const url = song.url || ''

  return (
    <div style={{ background: '#0D0D1A', borderRadius: 14, padding: 20, border: `1px solid ${c.p}44`, boxShadow: `0 4px 24px ${c.g}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <button onClick={toggle} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${c.p}, ${c.s})`,
          fontSize: 18, flexShrink: 0, boxShadow: `0 4px 16px ${c.g}`,
        }}>
          {playing ? '⏸' : '▶'}
        </button>
        <div>
          <p style={{ color: '#CBD5E1', fontWeight: 700, fontSize: 15, fontFamily: "'Space Grotesk', sans-serif" }}>
            Version {index + 1}
          </p>
          <p style={{ color: '#475569', fontSize: 12 }}>Générée par Hugging Face · MusicGen</p>
        </div>
        {url && (
          <a href={url} download={`aura-composition-${index + 1}.wav`}
            style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, background: c.p + '22', border: `1px solid ${c.p}55`, color: c.s, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ↓ Télécharger
          </a>
        )}
      </div>
      {url ? (
        <>
          <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
          <audio controls src={url} style={{ width: '100%', height: 36, borderRadius: 8 }} />
        </>
      ) : (
        <p style={{ color: '#475569', fontSize: 13 }}>Audio non disponible</p>
      )}
    </div>
  )
}

export default function Home() {
  const [mood, setMood]         = useState(DEFAULT_MOOD)
  const [step, setStep]         = useState(0)
  const [error, setError]       = useState('')
  const [file, setFile]         = useState(null)
  const [fileName, setFileName] = useState('')
  const [audioURL, setAudioURL] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [songs, setSongs]       = useState([])
  const [isDrag, setIsDrag]     = useState(false)
  const [pollMsg, setPollMsg]   = useState('')
  const fileRef = useRef(null)

  const c = MOODS[mood] || MOODS[DEFAULT_MOOD]

  const pickFile = useCallback((f) => {
    if (!f) return
    if (!f.type.startsWith('audio/')) { setError('Format invalide — MP3, WAV, M4A, OGG, FLAC acceptés'); return }
    setError(''); setFile(f); setFileName(f.name)
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioURL(URL.createObjectURL(f))
    setStep(0); setAnalysis(null); setSongs([])
  }, [audioURL])

  const run = async () => {
    if (!file) return
    setError(''); setSongs([]); setAnalysis(null)

    try {
      // 1 — Upload
      setStep(1)
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const upRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimetype: file.type, data: base64 }),
      })
      const upData = await upRes.json()
      if (!upRes.ok) throw new Error(upData.error || 'Upload échoué')

      // 2 — Analyse Claude
      setStep(2)
      const descRes = await fetch('/api/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: upData.file_id, filename: fileName }),
      })
      const descData = await descRes.json()
      if (!descRes.ok) throw new Error(descData.error || 'Analyse échouée')
      setAnalysis(descData.analysis)
      setMood(descData.analysis?.mood || DEFAULT_MOOD)

      // 3 — Generate via proxy Vercel
      setStep(3)
      setPollMsg('MusicGen compose ta musique… (30-60 sec)')
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: descData.analysis.prompt_mureka }),
      })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error || 'Génération échouée')

      if (genData.audio_base64) {
        const audioUrl = `data:audio/wav;base64,${genData.audio_base64}`
        setSongs([{ url: audioUrl }])
        setStep(4)
      }

    } catch (e) {
      setError(e.message)
      setStep(0)
    }
  }

  const busy = step > 0 && step < 4
  const stepLabels = [
    { label: 'Upload de ta musique', done: step > 1, active: step === 1 },
    { label: 'Analyse du style & mood', done: step > 2, active: step === 2 },
    { label: 'Génération Hugging Face', done: step > 3, active: step === 3 },
  ]

  return (
    <>
      <Head>
        <title>AURA · Studio IA Musical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070710; color: #E2E8F0; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(18px) } to { opacity:1;transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .fu { animation: fadeUp .45s ease both }
        audio { accent-color: ${c.p}; }
        ::-webkit-scrollbar { width:5px } ::-webkit-scrollbar-track { background:#0A0A15 } ::-webkit-scrollbar-thumb { background:#2A2A40; border-radius:3px }
      `}</style>

      <header style={{ padding: '28px 24px 20px', borderBottom: '1px solid #ffffff0D', background: 'linear-gradient(180deg,#0D0D1A,transparent)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${c.p},${c.s})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'background .6s' }}>🎵</div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', background: `linear-gradient(135deg,${c.s},#fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transition: 'background .6s' }}>
              AURA · Studio IA Musical
            </h1>
            <p style={{ color: '#475569', fontSize: 12 }}>Propulsé par Hugging Face · Analyse par Claude</p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px 80px' }}>

        <div style={{ background: '#0D0D1A', borderRadius: 16, padding: '18px 18px 10px', marginBottom: 20, border: `1px solid ${c.p}33`, boxShadow: `0 0 40px ${c.g}`, transition: 'border-color .6s,box-shadow .6s' }}>
          <Waveform mood={mood} active={busy} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 2px' }}>
            <span style={{ color: '#334155', fontSize: 12 }}>{file ? fileName : "En attente d'une piste audio"}</span>
            <span style={{ color: c.s, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>{mood}</span>
          </div>
        </div>

        {step > 0 && (
          <div style={{ background: '#0A0A15', borderRadius: 14, padding: '16px 20px', marginBottom: 20, border: '1px solid #1A1A30', display: 'flex', flexDirection: 'column', gap: 10 }} className="fu">
            {stepLabels.map((s, i) => (
              <Step key={i} n={i+1} label={s.label} active={s.active} done={s.done} color={c.p} />
            ))}
            {step === 3 && <p style={{ color: '#475569', fontSize: 12, paddingLeft: 42, animation: 'pulse 1.5s infinite' }}>{pollMsg}</p>}
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
          onDragLeave={() => setIsDrag(false)}
          onDrop={e => { e.preventDefault(); setIsDrag(false); pickFile(e.dataTransfer.files[0]) }}
          onClick={() => !busy && fileRef.current?.click()}
          style={{ border: `2px dashed ${isDrag ? c.p : '#1E1E35'}`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', cursor: busy ? 'not-allowed' : 'pointer', background: isDrag ? c.p + '0F' : '#0A0A15', transition: 'all .25s', marginBottom: 16 }}
        >
          <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => pickFile(e.target.files[0])} />
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎧</div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: '#CBD5E1', marginBottom: 4 }}>
            {file ? fileName : 'Dépose ta musique de référence'}
          </p>
          <p style={{ color: '#334155', fontSize: 13 }}>MP3 · WAV · M4A · OGG · FLAC · Glisser ou cliquer</p>
        </div>

        {audioURL && (
          <div style={{ background: '#0D0D1A', borderRadius: 12, padding: '12px 16px', border: '1px solid #1A1A30', marginBottom: 16 }}>
            <p style={{ color: '#334155', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Référence</p>
            <audio controls src={audioURL} style={{ width: '100%', height: 36, borderRadius: 8 }} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: '#EF444418', border: '1px solid #EF444444', color: '#FCA5A5', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={run} disabled={!file || busy} style={{
          width: '100%', padding: 16, borderRadius: 14, border: 'none',
          background: (!file || busy) ? '#111120' : `linear-gradient(135deg,${c.p},${c.s})`,
          color: (!file || busy) ? '#2A2A45' : '#fff',
          fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700,
          cursor: (!file || busy) ? 'not-allowed' : 'pointer',
          boxShadow: (!file || busy) ? 'none' : `0 8px 32px ${c.g}`,
          transition: 'all .3s', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {busy
            ? <><span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #ffffff30', borderTop: '2px solid #fff', animation: 'spin .8s linear infinite', display: 'inline-block' }} /> Génération en cours…</>
            : '🎼 Analyser & Créer une nouvelle musique'
          }
        </button>

        {analysis && (
          <div className="fu" style={{ background: '#0D0D1A', borderRadius: 16, padding: 20, border: `1px solid ${c.p}33`, marginBottom: 20, boxShadow: `0 4px 24px ${c.g}` }}>
            <p style={{ color: '#334155', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>✨ Analyse de ta musique</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                ['🎭 Mood', analysis.mood],
                ['🎵 Genre', analysis.genre],
                ['⚡ BPM', analysis.bpm],
                ['🎹 Instruments', analysis.instruments?.join(', ')],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#0A0A15', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ color: '#334155', fontSize: 11, marginBottom: 4 }}>{k}</p>
                  <p style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>{v || '—'}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#0A0A15', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ color: '#334155', fontSize: 11, marginBottom: 6 }}>🎼 Nouvelle composition</p>
              <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>{analysis.ambiance}</p>
            </div>
          </div>
        )}

        {songs.length > 0 && (
          <div className="fu">
            <p style={{ color: '#334155', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              🎉 Composition générée !
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {songs.map((s, i) => <SongCard key={i} song={s} index={i} mood={mood} />)}
            </div>
            <button
              onClick={() => { setStep(0); setSongs([]); setAnalysis(null); setFile(null); setFileName(''); setAudioURL(null) }}
              style={{ marginTop: 20, width: '100%', padding: 14, borderRadius: 12, border: '1px solid #1E1E35', background: 'transparent', color: '#475569', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
            >
              ↩ Nouvelle création
            </button>
          </div>
        )}

        {step === 0 && !file && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#1E1E35' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: .4 }}>🌌</div>
            <p style={{ fontSize: 14 }}>Upload une piste pour commencer</p>
          </div>
        )}
      </main>
    </>
  )
}
