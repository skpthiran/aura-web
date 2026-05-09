import { supabase } from '../supabase'
import { Moment } from '../../types'

export async function getNearbyMoments(
  lat: number,
  lng: number,
  radiusKm: number = 50
): Promise<Moment[]> {
  const { data, error } = await supabase.rpc('nearby_moments', {
    lat,
    lng,
    radius_meters: radiusKm === 0 ? 40075000 : radiusKm * 1000
  })
  if (error) throw error
  return (data ?? []) as Moment[]
}

export async function getAllActiveMoments(): Promise<Moment[]> {
  // Use 0 radius for Global search as defined in the new RPC
  const { data, error } = await supabase.rpc('nearby_moments', {
    lat: 0,
    lng: 0,
    radius_meters: 40075000 // Global
  })
  
  if (error) throw error
  return (data ?? []) as Moment[]
}

export async function getCreatedMoments(userId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Moment[]
}

export async function getActiveMomentsByCreator(userId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('creator_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Moment[]
}

export async function getJoinedMomentsHistory(userId: string): Promise<Moment[]> {
  // 1. Get IDs of moments user has joined (filter for 'joined' status)
  const { data: participantRows, error: e1 } = await supabase
    .from('participants')
    .select('moment_id')
    .eq('user_id', userId)
    .eq('status', 'joined')

  if (e1) throw e1
  if (!participantRows || participantRows.length === 0) return []

  const momentIds = participantRows.map(p => p.moment_id)

  // 2. Fetch the moments, filtering out duplicates if they are already in "created"
  const { data: moments, error: e2 } = await supabase
    .from('moments')
    .select('*')
    .in('id', momentIds)
    .order('created_at', { ascending: false })

  if (e2) throw e2
  return (moments ?? []) as Moment[]
}

export async function getRecentJoins(signalIds: string[]): Promise<any[]> {
  const since = new Date(Date.now() - 86400000).toISOString()
  const { data, error } = await supabase
    .from('participants')
    .select('*, moments(id, title, tags, moment_type)')
    .in('moment_id', signalIds)
    .gte('joined_at', since)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return data ?? []
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
  start_time?: string
  end_time?: string
  venue?: string
  is_private?: boolean
  dresscode?: string
  age_min?: number
  age_max?: number
  image_url?: string
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

  if (payload.image_url) insertData.image_url = payload.image_url

  if (payload.expires_at) {
    insertData.expires_at = payload.expires_at
  }
  
  if (payload.start_time) insertData.start_time = payload.start_time
  if (payload.end_time) insertData.end_time = payload.end_time
  if (payload.venue) insertData.venue = payload.venue
  if (payload.is_private !== undefined) insertData.is_private = payload.is_private
  if (payload.dresscode) insertData.dresscode = payload.dresscode
  if (payload.age_min) insertData.age_min = payload.age_min
  if (payload.age_max) insertData.age_max = payload.age_max

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
    .upsert({
      moment_id: momentId,
      user_id: user.id,
      status: 'joined',
      joined_at: new Date().toISOString(),
    }, {
      onConflict: 'moment_id,user_id'
    })

  if (error) throw new Error(error.message)
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

export async function expireOldMoments(): Promise<void> {
  try {
    await supabase.rpc('expire_old_moments')
  } catch {
    // Silent fail — not critical
  }
}
