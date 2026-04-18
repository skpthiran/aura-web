import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
      }
      moments: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          location: unknown
          capacity_limit: number
          expires_at: string
          is_active: boolean
          created_at: string
        }
      }
      participants: {
        Row: {
          id: string
          moment_id: string
          user_id: string
          status: string
          joined_at: string
        }
      }
    }
  }
}
