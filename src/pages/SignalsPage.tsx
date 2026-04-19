import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Bell, Zap, Calendar, Users, MessageSquare, 
  MapPin, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'

interface Signal {
  id: string
  type: 'join' | 'message' | 'new_moment' | 'event'
  title: string
  subtitle: string
  timestamp: string
  read: boolean
  moment_id?: string
  moment_type?: string
}

export default function SignalsPage() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'joins' | 'messages'>('all')

  useEffect(() => {
    if (!user) return
    fetchSignals()
  }, [user])

  const fetchSignals = async () => {
    if (!user) return
    setLoading(true)
    try {
      const results: Signal[] = []

      // 1. Get joins on user's moments
      // Get user's created moments first to avoid complex RLS joins
      const { data: myMoments } = await supabase
        .from('moments')
        .select('id, title, moment_type')
        .eq('creator_id', user.id)
        .eq('is_active', true)

      if (myMoments && myMoments.length > 0) {
        const myMomentIds = myMoments.map((m) => m.id)
        
        const { data: joins } = await supabase
          .from('participants')
          .select('id, created_at, moment_id, user_id')
          .in('moment_id', myMomentIds)
          .neq('user_id', user.id)
          .eq('status', 'joined')
          .order('created_at', { ascending: false })
          .limit(20)

        if (joins) {
          interface JoinRow {
            id: string;
            created_at: string;
            moment_id: string;
            user_id: string;
          }

          (joins as unknown as JoinRow[]).forEach((j) => {
            const moment = myMoments.find((m) => m.id === j.moment_id)
            if (moment) {
              results.push({
                id: `join-${j.id}`,
                type: 'join',
                title: `Someone joined "${moment.title}"`,
                subtitle: 'A new participant entered your signal',
                timestamp: j.created_at,
                read: false,
                moment_id: moment.id,
                moment_type: moment.moment_type
              })
            }
          })
        }
      }

      // 2. Get messages on user's joined moments
      const { data: participantRows } = await supabase
        .from('participants')
        .select('moment_id')
        .eq('user_id', user.id)
        .eq('status', 'joined')

      if (participantRows && participantRows.length > 0) {
        const momentIds = participantRows.map((p) => p.moment_id)
        const { data: messages } = await supabase
          .from('chat_messages')
          .select(`
            id, content, created_at, moment_id, user_id,
            moments(title, moment_type)
          `)
          .in('moment_id', momentIds)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (messages) {
          interface MessageRow {
            id: string;
            content: string;
            created_at: string;
            moment_id: string;
            user_id: string;
            moments: {
              title: string;
              moment_type: string;
            } | null;
          }

          (messages as unknown as MessageRow[]).forEach((msg) => {
            const m = msg.moments
            results.push({
              id: `msg-${msg.id}`,
              type: 'message',
              title: `New message in "${m?.title ?? 'a signal'}"`,
              subtitle: msg.content.length > 60 
                ? msg.content.slice(0, 60) + '...' 
                : msg.content,
              timestamp: msg.created_at,
              read: false,
              moment_id: msg.moment_id,
              moment_type: m?.moment_type
            })
          })
        }
      }

      // Sort by timestamp
      results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setSignals(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSignals = signals.filter(s => {
    if (filter === 'joins') return s.type === 'join'
    if (filter === 'messages') return s.type === 'message'
    return true
  })

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 py-10">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="micro-caps text-gold mb-2">Activity</p>
            <h1 className="font-serif text-4xl text-marble">Signals</h1>
          </div>
          <div className="flex items-center gap-3">
            {signals.filter(s => !s.read).length > 0 && (
              <span className="micro-caps text-xs text-crimson-bright
                bg-crimson/10 border border-crimson/20 rounded-full px-3 py-1">
                {signals.filter(s => !s.read).length} new
              </span>
            )}
            <button
              onClick={fetchSignals}
              className="w-9 h-9 glass-panel hairline-all rounded-full
                flex items-center justify-center text-marble/40
                hover:text-gold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'all', label: 'All' },
            { key: 'joins', label: 'Joins' },
            { key: 'messages', label: 'Messages' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                'micro-caps text-xs px-5 py-2 rounded-full transition-all duration-300',
                filter === tab.key
                  ? 'bg-marble text-void font-medium'
                  : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="micro-caps text-marble/30">Scanning signals...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredSignals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-full glass-panel hairline-all
              flex items-center justify-center">
              <Bell className="w-6 h-6 text-marble/20" />
            </div>
            <div>
              <p className="font-serif text-2xl text-marble/30 mb-2">
                No signals yet
              </p>
              <p className="text-sm text-marble/20 max-w-xs">
                Activity from your moments and joined signals will appear here.
              </p>
            </div>
            <Link to="/app/create">
              <button className="micro-caps text-sm px-6 py-3
                glass-panel hairline-all rounded-full text-marble/50
                hover:text-marble transition-all">
                Create a Signal
              </button>
            </Link>
          </motion.div>
        )}

        {/* Signal list */}
        {!loading && filteredSignals.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredSignals.map((signal, i) => {
              const isEvent = signal.moment_type === 'event'
              const Icon = signal.type === 'join' ? Users 
                : signal.type === 'message' ? MessageSquare 
                : isEvent ? Calendar : Zap

              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'glass-panel hairline-all rounded-2xl p-4',
                    'flex items-start gap-4 transition-all duration-300',
                    'hover:border-white/20'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    signal.type === 'join'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : signal.type === 'message'
                        ? 'bg-gold/10 border border-gold/20'
                        : isEvent
                          ? 'bg-gold/10 border border-gold/20'
                          : 'bg-crimson/10 border border-crimson/20'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      signal.type === 'join' ? 'text-green-400'
                        : signal.type === 'message' ? 'text-gold'
                        : isEvent ? 'text-gold' : 'text-crimson-bright'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-marble font-medium mb-0.5">
                      {signal.title}
                    </p>
                    <p className="text-xs text-marble/40 line-clamp-1">
                      {signal.subtitle}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right">
                    <span className="micro-caps text-xs text-marble/30">
                      {timeAgo(signal.timestamp)}
                    </span>
                    {!signal.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-crimson-bright ml-auto mt-1" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
