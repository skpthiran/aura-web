import { useState, useEffect, useCallback, useRef } from 'react'
import { Moment } from '../types'
import { supabase } from '../lib/supabase'
import { useUserLocation } from './useUserLocation'
import { getRadiusValue } from '../lib/radius'

export function useNearbyMoments(radiusLabel: string = '50 KM') {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { location, loading: locationLoading } = useUserLocation()

  // Round to 4 decimal places (~11m precision) to prevent floating point churn
  const lat = location ? Math.round(location.latitude * 10000) / 10000 : 6.9271
  const lng = location ? Math.round(location.longitude * 10000) / 10000 : 79.8612

  // Track last fetched params to prevent duplicate fetches
  const lastFetchRef = useRef<string>('')

  const fetchMoments = useCallback(async (fetchLat: number, fetchLng: number, fetchRadius: string) => {
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
        radius_meters: radiusKm === 0 ? 40075000 : radiusKm * 1000
      })
      if (rpcError) throw rpcError
      setMoments((data ?? []) as Moment[])
    } catch (err) {
      console.error('[useNearbyMoments] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (locationLoading) return
    fetchMoments(lat, lng, radiusLabel)
  }, [lat, lng, radiusLabel, locationLoading, fetchMoments])

  const refetch = useCallback(() => {
    lastFetchRef.current = '' // clear cache so next call forces a fresh fetch
    fetchMoments(lat, lng, radiusLabel)
  }, [lat, lng, radiusLabel, fetchMoments])

  return { moments, loading: loading || locationLoading, error, refetch, setMoments }
}
