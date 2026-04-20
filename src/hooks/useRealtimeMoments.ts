import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Moment } from '../types'

interface RealtimeConfig {
  onInsert?: (moment: Moment) => void
  onUpdate?: (moment: Moment) => void
  onDelete?: (id: string) => void
  filter?: string
}

export function useRealtimeMoments({ onInsert, onUpdate, onDelete, filter }: RealtimeConfig) {
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)

  // Update refs when callbacks change to avoid re-subscription
  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  }, [onInsert, onUpdate, onDelete])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:moments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moments',
          filter: filter || 'is_active=eq.true',
        },
        (payload) => {
          if (payload.new && onInsertRef.current) {
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
            // If the moment was updated to be inactive, treat it as a delete for the UI
            if (moment.is_active === false && onDeleteRef.current) {
               onDeleteRef.current(moment.id)
            } else if (onUpdateRef.current) {
               onUpdateRef.current(moment)
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
          if (payload.old?.id && onDeleteRef.current) {
            onDeleteRef.current(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter])
}
