import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { supabase } from '../lib/supabase'
import { useUserLocation } from './useUserLocation'
import { getRadiusValue } from '../lib/radius'

export function useNearbyEvents(radiusLabel: string = '50 KM') {
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { location, loading: locationLoading } = useUserLocation()

  const lat = location?.latitude ?? 6.9271
  const lng = location?.longitude ?? 79.8612

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const radiusKm = getRadiusValue(radiusLabel)
      console.log('[useNearbyEvents] fetching — radius:', radiusLabel, '→', radiusKm, 'km', 'at:', lat, lng)
      const { data, error: rpcError } = await supabase.rpc('nearby_moments', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm
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
  }, [lat, lng, radiusLabel])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading: loading || locationLoading, error, refetch: fetchEvents, setEvents }
}
