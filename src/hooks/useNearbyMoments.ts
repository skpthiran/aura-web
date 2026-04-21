import { useState, useEffect, useCallback } from 'react'
import { Moment } from '../types'
import { supabase } from '../lib/supabase'
import { useUserLocation } from './useUserLocation'
import { getRadiusValue } from '../lib/radius'

export function useNearbyMoments(radiusLabel: string = '50 KM') {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { location, loading: locationLoading } = useUserLocation()

  const fetchMoments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const user_lat = location?.latitude ?? 6.9271
      const user_lng = location?.longitude ?? 79.8612
      const radiusKm = getRadiusValue(radiusLabel)
      const effective_radius = location ? radiusKm : 0

      console.log('[useNearbyMoments] fetching — radius:', radiusLabel, '→', effective_radius, 'km')

      const { data, error: rpcError } = await supabase.rpc('nearby_moments', {
        user_lat,
        user_lng,
        radius_km: effective_radius
      })

      if (rpcError) throw rpcError
      setMoments((data ?? []) as Moment[])
    } catch (err) {
      console.error('[useNearbyMoments] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [location, radiusLabel])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments])

  return { moments, loading: loading || locationLoading, error, refetch: fetchMoments, setMoments }
}
