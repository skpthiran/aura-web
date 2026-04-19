import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { getNearbyMoments } from '../lib/db/moments'
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
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      const data = await getNearbyMoments(
        location.latitude,
        location.longitude,
        10000 // 10km radius for events
      )
      // Filter only events
      setEvents(data.filter(m => m.moment_type === 'event'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    if (!location) return
    fetchEvents()
    const interval = setInterval(fetchEvents, 60000)
    return () => clearInterval(interval)
  }, [fetchEvents, location])

  return { events, loading, error, refetch: fetchEvents }
}
