import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyEvents(location: UserLocation | null): {
  events: Moment[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data: Moment[]
      if (location) {
        data = await getNearbyMoments(
          location.latitude,
          location.longitude,
          50000 
        )
        if (data.length === 0) {
          data = await getAllActiveMoments()
        }
      } else {
        data = await getAllActiveMoments()
      }
      // Filter only events
      setEvents(data.filter(m => m.moment_type === 'event'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 60000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
