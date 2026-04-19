import { supabase } from '../supabase'
import { Moment } from '../../types'

export async function getNearbyMoments(
  lat: number,
  lng: number,
  radiusMeters: number = 50000
): Promise<Moment[]> {
  const { data, error } = await supabase.rpc('nearby_moments', {
    p_lat: lat,
    p_lng: lng,
    p_radius: radiusMeters
  })
  if (error) throw error
  return data as Moment[]
}

export async function getAllActiveMoments(): Promise<Moment[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return (data ?? []).map(m => ({
    ...m,
    distance_meters: undefined,
    participant_count: 0
  })) as Moment[]
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
  moment_type: 'moment' | 'event'
  tags?: string[]
  expires_at?: string
}): Promise<Moment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insertData: Record<string, unknown> = {
    creator_id: user.id,
    title: payload.title,
    description: payload.description,
    location: `POINT(${payload.lng} ${payload.lat})`,
    capacity_limit: payload.capacity_limit,
    moment_type: payload.moment_type,
    tags: payload.tags ?? []
  }

  if (payload.expires_at) {
    insertData.expires_at = payload.expires_at
  }

  const { data, error } = await supabase
    .from('moments')
    .insert(insertData)
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
