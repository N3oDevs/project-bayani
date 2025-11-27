'use client'

import { useEffect, useRef, useState } from 'react'

type OfferMsg = { type: 'offer'; sdp: RTCSessionDescriptionInit; room?: string }
type IceMsg = { type: 'ice'; candidate: RTCIceCandidateInit; room?: string; to?: 'webapp' | 'hardware' }
type TelemetryMsg = { type: 'telemetry'; room?: string; gps: { lat: number; lon: number } }

export default function WebAppPage() {
  const [wsOpen, setWsOpen] = useState(false)
  const [incomingOffer, setIncomingOffer] = useState<OfferMsg | null>(null)
  const [inCall, setInCall] = useState(false)
  const [telemetry, setTelemetry] = useState<{ lat: number; lon: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL ?? 'ws://localhost:8000/ws/signaling'
  const room = 'default'

  useEffect(() => {
    const ws = new WebSocket(signalingUrl)
    wsRef.current = ws
    ws.onopen = () => {
      setWsOpen(true)
      ws.send(JSON.stringify({ type: 'join', role: 'webapp', room }))
      ws.send(JSON.stringify({ type: 'ready', room, to: 'hardware' }))
    }
    ws.onmessage = (ev) => {
      let msg
      try { msg = JSON.parse(ev.data) } catch { return }
      if (msg.type === 'offer') {
        setIncomingOffer(msg)
      } else if (msg.type === 'telemetry' && msg.gps) {
        setTelemetry(msg.gps)
      } else if (msg.type === 'ice' && msg.candidate) {
        if (pcRef.current) {
          pcRef.current.addIceCandidate(msg.candidate).catch(() => {})
        }
      } else if (msg.type === 'peer_joined' && msg.role === 'hardware') {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ready', room, to: 'hardware' }))
        }
      } else if (msg.type === 'peer_disconnected') {
        endCall()
      }
    }
    return () => {
      ws.close()
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
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: e.candidate, room, to: 'hardware' }))
      }
    }
    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer.sdp))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    wsRef.current?.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription, room }))
    setIncomingOffer(null)
    setInCall(true)
  }

  function rejectCall() {
    wsRef.current?.send(JSON.stringify({ type: 'reject', room }))
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
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Web App Client</h1>
      <div className="text-sm">{wsOpen ? 'Signaling connected' : 'Connecting...'}</div>

      {incomingOffer && !inCall && (
        <div className="flex items-center gap-4">
          <span>Incoming Call</span>
          <button onClick={acceptCall} className="px-4 py-2 rounded bg-green-600 text-white">Accept</button>
          <button onClick={rejectCall} className="px-4 py-2 rounded bg-gray-600 text-white">Reject</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-black rounded overflow-hidden aspect-video relative border">
          <video ref={videoRef} className="w-full h-full object-contain" playsInline />
        </div>
        <div className="text-sm">{telemetry ? `GPS lat=${telemetry.lat.toFixed(5)} lon=${telemetry.lon.toFixed(5)}` : 'GPS idle'}</div>
      </div>
    </div>
  )
}
