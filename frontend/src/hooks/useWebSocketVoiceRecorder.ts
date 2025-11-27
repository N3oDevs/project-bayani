'use client'

import { useState, useRef, useCallback } from 'react'

export interface RecordingData {
  blob: Blob
  duration: number
  url: string
}

interface UseWebSocketRecorderOptions {
  wsUrl?: string
  onError?: (error: string) => void
}

export function useWebSocketVoiceRecorder(options: UseWebSocketRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = useCallback(async (websocketUrl?: string) => {
    try {
      setError(null)
      setIsConnecting(true)

      const wsUrl =
        websocketUrl ||
        options.wsUrl ||
        process.env.NEXT_PUBLIC_AUDIO_WS_URL ||
        'wss://c23df3c2d06a-7860.proxy.runpod.net/ws/audio'
      
      // Connect to WebSocket
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected for audio recording')
        setIsConnecting(false)
        setIsRecording(true)
        chunksRef.current = []
        startTimeRef.current = Date.now()

        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 100)

        // Send start recording signal
        ws.send(JSON.stringify({ action: 'start_recording' }))
      }

      ws.onerror = (event) => {
        const msg = 'WebSocket connection failed'
        setError(msg)
        setIsConnecting(false)
        options.onError?.(msg)
        console.error('WebSocket error:', event)
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
        setIsConnecting(false)
      }

      ws.onmessage = (event) => {
        try {
          // Handle binary audio data
          if (event.data instanceof Blob) {
            chunksRef.current.push(event.data)
          } 
          // Handle base64 encoded audio
          else if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)
            
            if (data.audio) {
              // Convert base64 to blob
              const base64Data = data.audio.split(',')[1] || data.audio
              const binaryString = atob(base64Data)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const blob = new Blob([bytes], { type: data.mimeType || 'audio/webm' })
              chunksRef.current.push(blob)
            }
            
            if (data.error) {
              setError(data.error)
              options.onError?.(data.error)
            }
          }
        } catch (err) {
          console.error('Error processing audio data:', err)
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      setError(message)
      setIsConnecting(false)
      options.onError?.(message)
      console.error('Recording error:', err)
    }
  }, [options])

  const pauseRecording = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'pause' }))
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'resume' }))
      setIsPaused(false)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 100)
    }
  }, [])

  const stopRecording = useCallback((): Promise<RecordingData> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current

      if (!ws) {
        reject(new Error('No recording in progress'))
        return
      }

      // Send stop signal
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'stop' }))
      }

      // Wait a bit for final chunks
      setTimeout(() => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)

        // Clean up
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }

        setIsRecording(false)
        setIsPaused(false)
        setRecordingTime(0)

        resolve({ blob, duration, url })
      }, 500)
    })
  }, [])

  const cancelRecording = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'cancel' }))
        wsRef.current.close()
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    chunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
  }, [])

  return {
    isRecording,
    isPaused,
    recordingTime,
    error,
    isConnecting,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  }
}
