import { supabase } from '../supabase'
import { Moment } from '../../types'

export async function getNearbyMoments(
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<Moment[]> {
  const { data, error } = await supabase.rpc('nearby_moments', {
    lat,
    lng,
    radius_meters: radiusMeters
  })
  if (error) throw error
  return data as Moment[]
}

export async function getMomentById(id: string): Promise<Moment | null> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Moment
}

export async function createMoment(payload: {
  title: string
  description?: string
  lat: number
  lng: number
  capacity_limit: number
  expires_at: string
  moment_type: 'moment' | 'event'
  tags?: string[]
}): Promise<Moment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('moments')
    .insert({
      creator_id: user.id,
      title: payload.title,
      description: payload.description,
      location: `POINT(${payload.lng} ${payload.lat})`,
      capacity_limit: payload.capacity_limit,
      expires_at: payload.expires_at,
      moment_type: payload.moment_type,
      tags: payload.tags ?? []
    })
    .select()
    .single()

  if (error) throw error
  return data as Moment
}

export async function joinMoment(momentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('participants')
    .insert({ moment_id: momentId, user_id: user.id })

  if (error) throw error
}

export async function leaveMoment(momentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('participants')
    .update({ status: 'left' })
    .eq('moment_id', momentId)
    .eq('user_id', user.id)

  if (error) throw error
}
