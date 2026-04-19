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
  // Use center of Sri Lanka with 500km radius to get everything
  const { data, error } = await supabase.rpc('nearby_moments', {
    p_lat: 7.8731,
    p_lng: 80.7718,
    p_radius: 500000
  })
  
  if (error) {
    // fallback to basic query without lat/lng
    const { data: fallback, error: e2 } = await supabase
      .from('moments')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    
    if (e2) throw e2
    return (fallback ?? []) as Moment[]
  }
  
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

export async function joinMoment(momentId: string): Promise<{ 
  status: 'joined' | 'waitlist', position?: number 
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check current participant count vs capacity
  const { data: moment } = await supabase
    .from('moments')
    .select('capacity_limit')
    .eq('id', momentId)
    .single()

  const { count: currentCount } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('moment_id', momentId)
    .eq('status', 'joined')

  const isFull = (currentCount ?? 0) >= (moment?.capacity_limit ?? 999)

  // Get waitlist count for position
  const { count: waitlistCount } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('moment_id', momentId)
    .eq('status', 'waitlist')

  const status = isFull ? 'waitlist' : 'joined'
  const position = isFull ? (waitlistCount ?? 0) + 1 : undefined

  const { error } = await supabase
    .from('participants')
    .upsert({
      moment_id: momentId,
      user_id: user.id,
      status,
      position: position ?? null,
    }, { onConflict: 'moment_id,user_id' })

  if (error) throw error
  return { status, position }
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
