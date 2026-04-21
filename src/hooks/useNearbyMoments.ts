import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyMoments(
  location: UserLocation | null,
  radiusKm: number = 50
) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locationRef = useRef(location)
  const radiusRef = useRef(radiusKm)
  const fetchingRef = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    radiusRef.current = radiusKm
  }, [radiusKm])

  const fetchMoments = useCallback(async (radius?: number) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const loc = locationRef.current
      const r = radius ?? radiusRef.current
      let data: Moment[]
      
      if (r === 0) { // Global
        data = await getAllActiveMoments()
      } else if (loc) {
        // Use the km-based radius directly (migration updated RPC to take km)
        data = await getNearbyMoments(loc.latitude, loc.longitude, r)
      } else {
        // Default to global if no location
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

  // Fetch when radius changes
  useEffect(() => {
    fetchMoments(radiusKm)
  }, [radiusKm, fetchMoments])

  return { moments, loading, error, refetch: fetchMoments, setMoments }
}
