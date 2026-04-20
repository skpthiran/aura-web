import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { getNearbyMoments, getAllActiveMoments } from '../lib/db/moments'
import { UserLocation } from '../types'
import { useRealtimeMoments } from './useRealtimeMoments'

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

  // Update events in state via realtime
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    if (newMoment.moment_type !== 'event') return
    setEvents(prev => {
      if (prev.some(m => m.id === newMoment.id)) return prev
      return [newMoment, ...prev]
    })
  }, [])

  const handleRealtimeUpdate = useCallback((updatedMoment: Moment) => {
    if (updatedMoment.moment_type !== 'event') return
    setEvents(prev => prev.map(m => m.id === updatedMoment.id ? updatedMoment : m))
  }, [])

  const handleRealtimeDelete = useCallback((id: string) => {
    setEvents(prev => prev.filter(m => m.id !== id))
  }, [])

  useRealtimeMoments({
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete
  })

  // Fetch when radius changes
  useEffect(() => {
    fetchEvents(radiusMeters)
  }, [radiusMeters, fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
