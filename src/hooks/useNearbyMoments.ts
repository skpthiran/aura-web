import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyMoments(
  location: UserLocation | null, 
  radiusMeters: number = 50000
) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locationRef = useRef(location)
  const radiusRef = useRef(radiusMeters)
  const initialFetchDone = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  const fetchMoments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loc = locationRef.current
      let data: Moment[]
      if (loc) {
        // For global, fetch all
        if (radiusRef.current >= 99999999) {
          data = await getAllActiveMoments()
        } else {
          data = await getNearbyMoments(
            loc.latitude,
            loc.longitude,
            radiusRef.current
          )
          // If no local moments, fallback to global to not show empty screen
          if (data.length === 0) {
            data = await getAllActiveMoments()
          }
        }
      } else {
        data = await getAllActiveMoments()
      }
      setMoments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch moments')
    } finally {
      setLoading(false)
    }
  }, []) 

  // Re-fetch when radius changes
  useEffect(() => {
    radiusRef.current = radiusMeters
    fetchMoments()
  }, [radiusMeters, fetchMoments])

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true
      fetchMoments()
    }
    const interval = setInterval(fetchMoments, 30000)
    return () => clearInterval(interval)
  }, [fetchMoments])

  return { moments, loading, error, refetch: fetchMoments }
}
