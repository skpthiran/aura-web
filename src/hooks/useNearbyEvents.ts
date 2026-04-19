import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyEvents(
  location: UserLocation | null,
  radiusMeters: number = 50000
) {
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locationRef = useRef(location)
  const fetchingRef = useRef(false)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  const fetchEvents = useCallback(async (radius?: number) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const loc = locationRef.current
      const r = radius ?? radiusMeters
      let data: Moment[]
      
      if (r >= 99999999) {
        data = await getAllActiveMoments()
      } else if (loc) {
        data = await getNearbyMoments(loc.latitude, loc.longitude, r)
        if (data.length === 0) {
          data = await getAllActiveMoments()
        }
      } else {
        data = await getAllActiveMoments()
      }
      setEvents(data.filter(m => m.moment_type === 'event'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [radiusMeters])

  // Fetch when radius changes
  useEffect(() => {
    fetchEvents(radiusMeters)
  }, [radiusMeters, fetchEvents])

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => fetchEvents(), 60000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
