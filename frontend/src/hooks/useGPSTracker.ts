'use client'

import { useState, useEffect, useCallback } from 'react'

export interface GPSPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
}

interface UseGPSTrackerOptions {
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
  autoStart?: boolean
  trackingInterval?: number // Auto-update interval in ms
}

export function useGPSTracker(options: UseGPSTrackerOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 0,
    timeout = 10000,
    autoStart = false,
    trackingInterval = 5000, // Update every 5 seconds
  } = options

  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const gpsData: GPSPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    }
    setPosition(gpsData)
    setError(null)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = 'Failed to get location'
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied'
        break
      case err.POSITION_UNAVAILABLE:
        message = 'Location information unavailable'
        break
      case err.TIMEOUT:
        message = 'Location request timed out'
        break
    }
    
    setError(message)
    setIsLoading(false)
  }, [])

  const getCurrentPosition = useCallback(async (): Promise<GPSPosition | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSuccess(pos)
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          })
        },
        (err) => {
          handleError(err)
          resolve(null)
        },
        {
          enableHighAccuracy,
          maximumAge,
          timeout,
        }
      )
    })
  }, [enableHighAccuracy, maximumAge, timeout, handleSuccess, handleError])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    if (watchId !== null) {
      return // Already tracking
    }

    setIsTracking(true)
    setError(null)
    setIsLoading(true)

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      }
    )

    setWatchId(id)
  }, [watchId, enableHighAccuracy, maximumAge, timeout, handleSuccess, handleError])

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }, [watchId])

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart) {
      startTracking()
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [autoStart])

  return {
    position,
    error,
    isTracking,
    isLoading,
    getCurrentPosition,
    startTracking,
    stopTracking,
  }
}
