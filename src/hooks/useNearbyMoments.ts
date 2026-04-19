import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { getNearbyMoments } from '../lib/db/moments'
import { DEFAULT_RADIUS_METERS } from '../lib/constants'
import { UserLocation } from '../types'

export function useNearbyMoments(location: UserLocation | null, filterType: string = 'All') {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMoments = useCallback(async () => {
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      const data = await getNearbyMoments(
        location.latitude,
        location.longitude,
        DEFAULT_RADIUS_METERS
      )
      
      const now = new Date()
      let filtered = data

      if (filterType === 'Now') {
        filtered = data.filter(m => new Date(m.expires_at) > now)
      } else if (filterType === 'This Week') {
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        filtered = data.filter(m => {
          const d = new Date(m.expires_at)
          return d > now && d < nextWeek
        })
      } else if (filterType === 'This Month') {
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        filtered = data.filter(m => {
          const d = new Date(m.expires_at)
          return d > now && d < nextMonth
        })
      }
      // If filterType is 'All' or anything else, return unfiltered data
      setMoments(filtered)
    } catch (err) {
      console.error('Error fetching moments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch moments')
    } finally {
      setLoading(false)
    }
  }, [location, filterType])

  useEffect(() => {
    if (!location) return
    fetchMoments()
    const interval = setInterval(fetchMoments, 30000)
    return () => clearInterval(interval)
  }, [fetchMoments, location])

  return { moments, loading, error, refetch: fetchMoments }
}
