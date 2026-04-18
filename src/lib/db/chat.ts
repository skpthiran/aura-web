import { supabase } from '../supabase'
import { ChatMessage } from '../../types'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  momentId: z.string().uuid(),
  userId: z.string().uuid()
})

export async function getJoinedMoments(userId: string) {
  const { data, error } = await supabase
    .from('participants')
    .select(`
      moment_id,
      moments (
        id,
        title,
        moment_type,
        expires_at,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'joined')
  if (error) throw error
  return data
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
