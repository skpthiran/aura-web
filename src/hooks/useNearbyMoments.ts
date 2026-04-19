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
  const fetchingRef = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    radiusRef.current = radiusMeters
  }, [radiusMeters])

  const fetchMoments = useCallback(async (radius?: number) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const loc = locationRef.current
      const r = radius ?? radiusRef.current
      let data: Moment[]
      
      if (r >= 99999999) {
        // Global — fetch everything
        data = await getAllActiveMoments()
      } else if (loc) {
        data = await getNearbyMoments(loc.latitude, loc.longitude, r)
        if (data.length === 0) {
          data = await getAllActiveMoments()
        }
      } else {
        data = await getAllActiveMoments()
      }
      setMoments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Fetch when radius changes — pass new radius directly
  useEffect(() => {
    fetchMoments(radiusMeters)
  }, [radiusMeters, fetchMoments])

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => fetchMoments(), 30000)
    return () => clearInterval(interval)
  }, [fetchMoments])

  return { moments, loading, error, refetch: fetchMoments }
}
