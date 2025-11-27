'use client'

import { useEffect, useRef, useState } from 'react'

export default function HardwarePage() {
  const [connected, setConnected] = useState(false)
  const [calling, setCalling] = useState(false)
  const [telemetry, setTelemetry] = useState<{ lat: number; lon: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const telemTimerRef = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const room = 'default'

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SIGNAL_WS_URL || 'ws://localhost:8000/ws/signaling'
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', room, role: 'hardware' }))
    }
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg?.type === 'ready') {
          if (!calling) {
            startCall()
            return
          }
          const sdp = pcRef.current?.localDescription ? { type: pcRef.current.localDescription.type, sdp: pcRef.current.localDescription.sdp } : null
          if (sdp) wsRef.current?.send(JSON.stringify({ type: 'offer', sdp, room, to: 'webapp' }))
          return
        }
        if (msg?.type === 'answer' && msg.sdp) {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          }
        } else if (msg?.type === 'ice' && msg.candidate && (msg.from === 'webapp' || msg.to === 'hardware')) {
          if (pcRef.current) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch {}
          }
        } else if (msg?.type === 'reject') {
          endCall()
        }
      } catch {}
    }
    return () => {
      ws.close()
      if (telemTimerRef.current) window.clearInterval(telemTimerRef.current)
      if (pcRef.current) pcRef.current.close()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function startCall() {
    if (calling) return
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pcRef.current = pc
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current) {
        const init = e.candidate.toJSON()
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: init, room, to: 'webapp' }))
      }
    }
    pc.onconnectionstatechange = () => {
      if (!pcRef.current) return
      const st = pcRef.current.connectionState
      setConnected(st === 'connected')
    }
    pc.oniceconnectionstatechange = () => {
      if (!pcRef.current) return
      const st = pcRef.current.iceConnectionState
      if (st === 'failed' || st === 'disconnected' || st === 'closed') setConnected(false)
      if (st === 'connected') setConnected(true)
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    const sdp = pc.localDescription ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : null
    if (sdp) wsRef.current?.send(JSON.stringify({ type: 'offer', sdp, room, to: 'webapp' }))

    telemTimerRef.current = window.setInterval(() => {
      const lat = 14.58 + (Math.random() - 0.5) * 0.02
      const lon = 121.00 + (Math.random() - 0.5) * 0.02
      setTelemetry({ lat, lon })
      wsRef.current?.send(JSON.stringify({ type: 'telemetry', room, gps: { lat, lon } }))
    }, 1000)

    setCalling(true)
  }

  function endCall() {
    setCalling(false)
    if (telemTimerRef.current) window.clearInterval(telemTimerRef.current)
    telemTimerRef.current = null
    if (pcRef.current) pcRef.current.close()
    pcRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setConnected(false)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Hardware Simulator</h1>
      <div className="flex items-center gap-4">
        <button onClick={startCall} disabled={calling} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Start Call</button>
        <button onClick={endCall} disabled={!calling} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">End Call</button>
        <span className={connected ? 'text-green-600' : 'text-gray-500'}>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-black rounded overflow-hidden aspect-video relative border">
          <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
        </div>
        <div className="text-sm">{telemetry ? `GPS lat=${telemetry.lat.toFixed(5)} lon=${telemetry.lon.toFixed(5)}` : 'GPS idle'}</div>
      </div>
    </div>
  )
}

