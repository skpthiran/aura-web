import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Moment } from '../types'

/**
 * useRealtimeMoments hook
 * 
 * Uses stable ref callbacks and unique channel names to prevent 
 * subscription crashes and redundant re-renders.
 */
export function useRealtimeMoments(
  onInsert: (moment: Moment) => void,
  onDelete?: (id: string) => void,
) {
  const onInsertRef = useRef(onInsert)
  const onDeleteRef = useRef(onDelete)

  // Keep references stable to avoid re-subscribing when handlers change
  useEffect(() => {
    onInsertRef.current = onInsert
  }, [onInsert])

  useEffect(() => {
    onDeleteRef.current = onDelete
  }, [onDelete])

  useEffect(() => {
    // Generate a unique channel name to avoid collisions
    const channelName = `realtime:moments:${Math.random().toString(36).slice(2)}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moments',
        },
        (payload) => {
          if (payload.new) {
            onInsertRef.current(payload.new as Moment)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'moments',
        },
        (payload) => {
          if (payload.new) {
            const moment = payload.new as Moment
            // If it became inactive, treat as delete
            if (moment.is_active === false) {
              onDeleteRef.current?.(moment.id)
            } else {
              // Otherwise treat as update/insert for state sync
              onInsertRef.current(moment)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'moments',
        },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDeleteRef.current?.(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Empty deps = subscribe once per component mount
}
