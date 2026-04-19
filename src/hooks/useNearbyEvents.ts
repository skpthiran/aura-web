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
  const initialFetchDone = useRef(false)
  const locationRef = useRef(location)
  const radiusRef = useRef(radiusMeters)

  // Update ref without triggering re-render
  useEffect(() => {
    locationRef.current = location
  }, [location])

  const fetchEvents = useCallback(async () => {
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
          if (data.length === 0) {
            data = await getAllActiveMoments()
          }
        }
      } else {
        data = await getAllActiveMoments()
      }
      setEvents(data.filter(m => m.moment_type === 'event'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, []) 

  // Re-fetch when radius changes
  useEffect(() => {
    radiusRef.current = radiusMeters
    fetchEvents()
  }, [radiusMeters, fetchEvents])

  useEffect(() => {
    // Only fetch once on mount, then every 60 seconds
    if (!initialFetchDone.current) {
      initialFetchDone.current = true
      fetchEvents()
    }
    const interval = setInterval(fetchEvents, 60000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
