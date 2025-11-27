'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'

export default function VideoFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const predictWsRef = useRef<WebSocket | null>(null)
  const captureRef = useRef<HTMLCanvasElement | null>(null)
  const detectTimerRef = useRef<number | null>(null)
  const predictBusyRef = useRef<boolean>(false)

  const [error, setError] = useState<string | null>(null)
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  const [inCall, setInCall] = useState(false)
  const [telemetry, setTelemetry] = useState<{ lat: number; lon: number } | null>(null)
  const [detections, setDetections] = useState<Array<{ bbox: number[]; score?: number; label?: string }>>([])
  const room = 'default'

  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close()
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream
        s.getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SIGNAL_WS_URL || 'wss://c23df3c2d06a-7860.proxy.runpod.net/ws/signaling'
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', room, role: 'webapp' }))
      ws.send(JSON.stringify({ type: 'ready', room, to: 'hardware' }))
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg?.type === 'offer' && msg.sdp) {
          setIncomingOffer(msg.sdp)
        } else if (msg?.type === 'telemetry' && msg.gps) {
          setTelemetry(msg.gps)
        } else if (msg?.type === 'ice' && msg.candidate && (msg.from === 'hardware' || msg.to === 'webapp')) {
          if (pcRef.current) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {})
          }
        } else if (msg?.type === 'peer_disconnected') {
          endCall()
        }
      } catch {
        setError('Invalid message')
      }
    }
    ws.onclose = () => {}
    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'wss://c23df3c2d06a-7860.proxy.runpod.net/ws/predict'
    try {
      const ws = new WebSocket(url)
      predictWsRef.current = ws
      ws.onopen = () => {}
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          if (msg && Array.isArray(msg.predictions)) {
            setDetections(msg.predictions as Array<{ bbox: number[]; score?: number; label?: string }>)
          }
        } catch {}
        predictBusyRef.current = false
      }
      ws.onerror = () => { predictBusyRef.current = false }
      ws.onclose = () => { predictBusyRef.current = false }
    } catch {}
    return () => {
      if (predictWsRef.current) predictWsRef.current.close()
      predictWsRef.current = null
    }
  }, [])

  async function acceptCall() {
    if (!incomingOffer) return
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pcRef.current = pc
    pc.ontrack = (ev) => {
      const [stream] = ev.streams
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current) {
        const init = e.candidate.toJSON()
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: init, room, to: 'hardware' }))
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    const sdp = pc.localDescription ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : null
    if (sdp) wsRef.current?.send(JSON.stringify({ type: 'answer', sdp, room, to: 'hardware' }))
    setIncomingOffer(null)
    setInCall(true)
    startDetection()
  }

  function rejectCall() {
    wsRef.current?.send(JSON.stringify({ type: 'reject', room, to: 'hardware' }))
    setIncomingOffer(null)
  }

  function endCall() {
    setInCall(false)
    if (pcRef.current) pcRef.current.close()
    pcRef.current = null
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream
      s.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setTelemetry(null)
    stopDetection()
  }

  function startDetection() {
    if (detectTimerRef.current) return
    const detectFps = Math.max(1, Number(process.env.NEXT_PUBLIC_DETECT_FPS ?? '30'))
    const intervalMs = Math.max(10, Math.floor(1000 / detectFps))
    detectTimerRef.current = window.setInterval(() => {
      if (!videoRef.current) return
      if (!predictWsRef.current || predictWsRef.current.readyState !== WebSocket.OPEN) return
      if (predictBusyRef.current) return
      const v = videoRef.current
      const vw = v.videoWidth
      const vh = v.videoHeight
      if (!vw || !vh) return
      if (!captureRef.current) captureRef.current = document.createElement('canvas')
      const c = captureRef.current
      const targetWEnv = Number(process.env.NEXT_PUBLIC_DETECT_WIDTH ?? '640')
      const targetW = Math.max(64, Math.min(1920, isNaN(targetWEnv) ? 640 : targetWEnv))
      const targetH = Math.max(1, Math.round(targetW * vh / vw))
      c.width = targetW
      c.height = targetH
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.drawImage(v, 0, 0, targetW, targetH)
      const qEnv = Number(process.env.NEXT_PUBLIC_DETECT_JPEG_QUALITY ?? '0.7')
      const quality = Math.max(0.2, Math.min(0.95, isNaN(qEnv) ? 0.7 : qEnv))
      const dataUrl = c.toDataURL('image/jpeg', quality)
      predictBusyRef.current = true
      try {
        predictWsRef.current.send(JSON.stringify({ image: dataUrl }))
      } catch {
        predictBusyRef.current = false
      }
    }, intervalMs)
  }

  function stopDetection() {
    if (detectTimerRef.current) {
      window.clearInterval(detectTimerRef.current)
      detectTimerRef.current = null
    }
    setDetections([])
  }

  useEffect(() => {
    drawOverlay()
  }, [detections])

  function drawOverlay() {
    if (!overlayRef.current || !videoRef.current) return
    const canvas = overlayRef.current
    const v = videoRef.current
    const rect = canvas.getBoundingClientRect()
    const cw = Math.max(1, Math.round(rect.width))
    const ch = Math.max(1, Math.round(rect.height))
    if (canvas.width !== cw) canvas.width = cw
    if (canvas.height !== ch) canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cw, ch)
    const vw = v.videoWidth
    const vh = v.videoHeight
    if (!vw || !vh) return
    const s = Math.min(cw / vw, ch / vh)
    const dx = (cw - vw * s) / 2
    const dy = (ch - vh * s) / 2
    for (const d of detections) {
      const b = d.bbox
      if (!b || b.length < 4) continue
      const x = dx + b[0] * s
      const y = dy + b[1] * s
      const w = (b[2] - b[0]) * s
      const h = (b[3] - b[1]) * s
      const label = d.label ?? 'object'
      const score = d.score ?? 0
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      const text = `${label} ${score.toFixed(2)}`
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.font = '12px sans-serif'
      const tw = ctx.measureText(text).width + 8
      const th = 16
      ctx.fillRect(x, y - th, tw, th)
      ctx.fillStyle = '#00FF00'
      ctx.fillText(text, x + 4, y - 4)
    }
  }

  return (
    <div className="w-full h-full">
      <div className="bg-black dark:bg-black border-2 border-gray-700 dark:border-gray-700 rounded-xl overflow-hidden aspect-video relative shadow-2xl">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" playsInline />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {!inCall && (
          <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-black to-gray-900 dark:from-gray-900 dark:via-black dark:to-gray-900 flex flex-col items-center justify-center z-10">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto text-gray-600 dark:text-gray-600 mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0 4v2M6 9a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
              <p className="text-4xl font-bold text-gray-500 dark:text-gray-500 mb-3">Waiting for incoming call</p>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        )}

        {incomingOffer && !inCall && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl space-y-4">
              <div className="text-lg font-semibold">Incoming Call</div>
              <div className="flex items-center gap-4">
                <button onClick={acceptCall} className="px-4 py-2 rounded bg-green-600 text-white">Accept</button>
                <button onClick={rejectCall} className="px-4 py-2 rounded bg-gray-600 text-white">Reject</button>
              </div>
            </div>
          </div>
        )}

        {telemetry && (
          <div className="absolute top-2 left-2 z-20 px-3 py-1 rounded bg-black/70 text-white text-sm">
            {`lat=${telemetry.lat.toFixed(5)} lon=${telemetry.lon.toFixed(5)}`}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black to-transparent dark:from-black dark:via-black dark:to-transparent p-4 flex items-center justify-end z-20 opacity-90 transition-opacity">
          <button className="text-gray-200 dark:text-gray-200 hover:text-white transition-colors">
            <Maximize2 size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
