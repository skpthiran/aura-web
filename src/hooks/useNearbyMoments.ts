import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'

export function useNearbyMoments(location: UserLocation | null, filterType: string = 'All') {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMoments = useCallback(async () => {
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
        // If RPC returns empty, fall back to all moments
        if (data.length === 0) {
          data = await getAllActiveMoments()
        }
      } else {
        data = await getAllActiveMoments()
      }
      
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
      
      setMoments(filtered)
    } catch (err) {
      console.error('Error fetching moments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch moments')
    } finally {
      setLoading(false)
    }
  }, [location, filterType])

  useEffect(() => {
    fetchMoments()
    const interval = setInterval(fetchMoments, 30000)
    return () => clearInterval(interval)
  }, [fetchMoments])

  return { moments, loading, error, refetch: fetchMoments }
}
