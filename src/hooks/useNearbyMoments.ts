import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { getNearbyMoments } from '../lib/db/moments'
import { DEFAULT_RADIUS_METERS } from '../lib/constants'
import { UserLocation } from '../types'

export function useNearbyMoments(location: UserLocation | null) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMoments = useCallback(async () => {
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching moments for location:', location)
      const data = await getNearbyMoments(
        location.latitude,
        location.longitude,
        DEFAULT_RADIUS_METERS
      )
      console.log('Moments returned:', data)
      setMoments(data)
    } catch (err) {
      console.error('Error fetching moments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch moments')
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    if (!location) return
    fetchMoments()
    const interval = setInterval(fetchMoments, 30000)
    return () => clearInterval(interval)
  }, [fetchMoments, location])

  return { moments, loading, error, refetch: fetchMoments }
}
