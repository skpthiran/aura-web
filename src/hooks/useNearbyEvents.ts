import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { supabase } from '../lib/supabase'
import { useUserLocation } from './useUserLocation'
import { getRadiusValue } from '../lib/radius'

export function useNearbyEvents(radiusLabel: string = '50 KM') {
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { location, loading: locationLoading } = useUserLocation()

  // Round to 4 decimal places (~11m precision) to prevent floating point churn
  const lat = location ? Math.round(location.latitude * 10000) / 10000 : 6.9271
  const lng = location ? Math.round(location.longitude * 10000) / 10000 : 79.8612

  // Track last fetched params to prevent duplicate fetches
  const lastFetchRef = useRef<string>('')

  const fetchEvents = useCallback(async (fetchLat: number, fetchLng: number, fetchRadius: string) => {
    const key = `${fetchLat},${fetchLng},${fetchRadius}`
    if (lastFetchRef.current === key) return
    lastFetchRef.current = key

    setLoading(true)
    setError(null)
    try {
      const radiusKm = getRadiusValue(fetchRadius)
      const { data, error: rpcError } = await supabase.rpc('nearby_moments', {
        lat: fetchLat,
        lng: fetchLng,
        radius_meters: radiusKm
      })
      if (rpcError) throw rpcError
      const allSignals = (data ?? []) as Moment[]
      setEvents(allSignals.filter(m => m.moment_type === 'event'))
    } catch (err) {
      console.error('[useNearbyEvents] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (locationLoading) return
    fetchEvents(lat, lng, radiusLabel)
  }, [lat, lng, radiusLabel, locationLoading, fetchEvents])

  const refetch = useCallback(() => {
    lastFetchRef.current = '' // clear cache so next call forces a fresh fetch
    fetchEvents(lat, lng, radiusLabel)
  }, [lat, lng, radiusLabel, fetchEvents])

  return { events, loading: loading || locationLoading, error, refetch, setEvents }
}
