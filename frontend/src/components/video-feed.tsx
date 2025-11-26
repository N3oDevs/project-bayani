'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'

export default function VideoFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  const [inCall, setInCall] = useState(false)
  const [telemetry, setTelemetry] = useState<{ lat: number; lon: number } | null>(null)
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
    const url = process.env.NEXT_PUBLIC_SIGNAL_WS_URL || 'ws://localhost:8000/ws/signaling'
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
  }

  return (
    <div className="w-full h-full">
      <div className="bg-black dark:bg-black border-2 border-gray-700 dark:border-gray-700 rounded-xl overflow-hidden aspect-video relative shadow-2xl">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" playsInline />

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
