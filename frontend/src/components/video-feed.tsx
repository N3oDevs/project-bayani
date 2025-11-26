'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';

type Prediction = { bbox: number[]; score: number; label: string }
type PredictResponse = { predictions: Prediction[] }

export default function VideoFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const drawRef = useRef<HTMLCanvasElement | null>(null)
  const sendRef = useRef<HTMLCanvasElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<number | null>(null)

  const [running, setRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [lastPreds, setLastPreds] = useState<Prediction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [demo, setDemo] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/predict'

  useEffect(() => {
    if (demo) {
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = fileUrl ?? 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
        videoRef.current.play()
      }
      return
    }
    let stream: MediaStream | null = null
    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Camera access failed'
        setError(msg)
      }
    }
    setupCamera()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [demo, fileUrl])

  const sendFrame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    const v = videoRef.current
    const c = sendRef.current
    if (!v || !c) return
    const vw = v.videoWidth || 1280
    const vh = v.videoHeight || 720
    c.width = vw
    c.height = vh
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0, vw, vh)
    const dataUrl = c.toDataURL('image/jpeg', 0.7)
    wsRef.current.send(JSON.stringify({ image: dataUrl }))
  }, [])

  const drawOverlay = useCallback(() => {
    const v = videoRef.current
    const c = drawRef.current
    if (!v || !c) return
    const vw = v.videoWidth || 1280
    const vh = v.videoHeight || 720
    c.width = vw
    c.height = vh
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, vw, vh)
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.font = '14px system-ui'
    ctx.fillStyle = 'rgba(34,197,94,0.3)'
    for (const p of lastPreds) {
      const [x1, y1, x2, y2] = p.bbox
      const w = x2 - x1
      const h = y2 - y1
      ctx.fillRect(x1, y1, w, h)
      ctx.strokeRect(x1, y1, w, h)
      const label = `${p.label} ${(p.score * 100).toFixed(1)}%`
      ctx.fillStyle = '#22c55e'
      ctx.fillText(label, x1 + 6, y1 + 18)
      ctx.fillStyle = 'rgba(34,197,94,0.3)'
    }
  }, [lastPreds])

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      wsRef.current?.close()
      setConnected(false)
      return
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onerror = () => setError('WebSocket error')
    ws.onclose = () => setConnected(false)
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as PredictResponse
        setLastPreds(payload.predictions ?? [])
        drawOverlay()
      } catch {}
    }

    timerRef.current = window.setInterval(() => {
      sendFrame()
    }, 200)

    return () => {
      window.clearInterval(timerRef.current!)
      timerRef.current = null
      ws.close()
    }
  }, [running, wsUrl, sendFrame, drawOverlay])

  return (
    <div className="w-full h-full">
      <div className="bg-black dark:bg-black border-2 border-gray-700 dark:border-gray-700 rounded-xl overflow-hidden aspect-video relative shadow-2xl">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" muted playsInline />
        <canvas ref={drawRef} className="absolute inset-0 w-full h-full" />
        <canvas ref={sendRef} className="hidden" />

        {!connected && (
          <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-black to-gray-900 dark:from-gray-900 dark:via-black dark:to-gray-900 flex flex-col items-center justify-center z-10">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto text-gray-600 dark:text-gray-600 mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0 4v2M6 9a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
              <p className="text-4xl font-bold text-gray-500 dark:text-gray-500 mb-3">NO SIGNAL</p>
              <p className="text-base text-gray-600 dark:text-gray-600">Click Play for realtime detection</p>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black to-transparent dark:from-black dark:via-black dark:to-transparent p-4 flex items-center justify-between z-20 opacity-90 transition-opacity">
          <div className="flex gap-4">
            <button
              onClick={() => setRunning(true)}
              className="text-gray-200 dark:text-gray-200 hover:text-white disabled:opacity-50 transition-colors"
              disabled={running}
            >
              <Play size={28} />
            </button>
            <button
              onClick={() => setRunning(false)}
              className="text-gray-200 dark:text-gray-200 hover:text-white disabled:opacity-50 transition-colors"
              disabled={!running}
            >
              <Pause size={28} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 dark:text-gray-400 text-sm font-medium">
              {connected ? 'Realtime ON' : 'Idle'}
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (!f) return
                const url = URL.createObjectURL(f)
                setFileUrl(url)
                setDemo(true)
              }}
              className="text-gray-300 dark:text-gray-300"
            />
            <button
              onClick={() => setDemo((d) => !d)}
              className="text-gray-200 dark:text-gray-200 hover:text-white transition-colors"
            >
              {demo ? 'Camera' : 'Demo'}
            </button>
            <button className="text-gray-200 dark:text-gray-200 hover:text-white transition-colors">
              <Maximize2 size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
