import { supabase } from '../supabase'
import { ChatMessage } from '../../types'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  momentId: z.string().uuid(),
  userId: z.string().uuid()
})

export async function getJoinedMoments(userId: string) {
  // Step 1: get moment IDs user has joined
  const { data: participantData, error: pError } = await supabase
    .from('participants')
    .select('moment_id, status')
    .eq('user_id', userId)
    .eq('status', 'joined')
  
  if (pError) throw pError
  if (!participantData || participantData.length === 0) return []

  const momentIds = participantData.map(p => p.moment_id)

  // Step 2: get moment details
  const { data: momentsData, error: mError } = await supabase
    .from('moments')
    .select('id, title, moment_type, expires_at, is_active')
    .in('id', momentIds)
    .eq('is_active', true)

  if (mError) throw mError

  return (momentsData ?? []).map(m => ({
    moment_id: m.id,
    moments: m
  }))
}

export async function getChatMessages(momentId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('moment_id', momentId)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return data as ChatMessage[]
}

export async function sendMessage(momentId: string, userId: string, content: string) {
  // Validate input
  const validated = messageSchema.parse({ momentId, userId, content })

  const { error } = await supabase
    .from('chat_messages')
    .insert({ 
      moment_id: validated.momentId, 
      user_id: validated.userId, 
      content: validated.content 
    })
  if (error) throw error
}
