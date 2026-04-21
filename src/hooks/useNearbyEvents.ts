import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyEvents(
  location: UserLocation | null,
  radiusKm: number = 50
) {
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locationRef = useRef(location)
  const fetchingRef = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  const fetchEvents = useCallback(async (rParam?: number) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const loc = locationRef.current
      const r = rParam ?? radiusKm
      let data: Moment[]
      
      if (r === 0) { // Global
        data = await getAllActiveMoments()
      } else if (loc) {
        data = await getNearbyMoments(loc.latitude, loc.longitude, r)
      } else {
        // No location and not global? Return empty or global?
        // Standardizing: if no location and not global, return empty to prevent confusing user
        data = []
      }
      setEvents(data.filter(m => m.moment_type === 'event'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [radiusKm])

  // Fetch when radius changes
  useEffect(() => {
    fetchEvents(radiusKm)
  }, [radiusKm, fetchEvents])

  return { events, loading, error, refetch: fetchEvents, setEvents }
}
