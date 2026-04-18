import { useState, useEffect, useRef } from 'react'
import { UserLocation } from '../types'
import { STATIONARY_THRESHOLD_METERS, LOCATION_POLL_INTERVAL_MS } from '../lib/constants'

interface UseUserLocationReturn {
  location: UserLocation | null
  error: string | null
  loading: boolean
  isStationary: boolean
}

function distanceBetween(a: UserLocation, b: UserLocation): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (b.latitude - a.latitude) * Math.PI / 180
  const dLng = (b.longitude - a.longitude) * Math.PI / 180
  const lat1 = a.latitude * Math.PI / 180
  const lat2 = b.latitude * Math.PI / 180
  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStationary, setIsStationary] = useState(false)
  const lastLocation = useRef<UserLocation | null>(null)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const newLocation: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      }

      if (lastLocation.current) {
        const dist = distanceBetween(lastLocation.current, newLocation)
        setIsStationary(dist < STATIONARY_THRESHOLD_METERS)
      }

      lastLocation.current = newLocation
      setLocation(newLocation)
      setLoading(false)
    }

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message)
      setLoading(false)
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: LOCATION_POLL_INTERVAL_MS
    }

    watchId.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  return { location, error, loading, isStationary }
}
