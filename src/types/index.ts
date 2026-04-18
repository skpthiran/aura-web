export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Moment {
  id: string
  creator_id: string
  title: string
  description: string | null
  capacity_limit: number
  expires_at: string
  is_active: boolean
  created_at: string
  moment_type: 'moment' | 'event'
  tags: string[]
  lat: number
  lng: number
  distance_meters?: number
  participant_count?: number
}

export interface MapPin {
  id: string
  title: string
  lat: number
  lng: number
  moment_type: 'moment' | 'event'
  participant_count: number
  distance_meters: number
}


export interface Participant {
  id: string
  moment_id: string
  user_id: string
  status: 'pending' | 'joined' | 'left'
  joined_at: string
}

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}
