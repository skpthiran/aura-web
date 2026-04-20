import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Bell, Zap, Calendar, Users, MessageSquare, 
  MapPin, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

interface Notification {
  id: string
  type: 'join' | 'message' | 'new_moment' | 'event'
  title: string
  subtitle: string
  timestamp: string
  read: boolean
  moment_id?: string
  moment_type?: string
  moment_title?: string
  full_name?: string | null
  avatar_url?: string | null
  joined_at: string
}

export default function SignalsPage() {
  usePageTitle('Signals')
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
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
      const results: Notification[] = []

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
          .select(`
            id, created_at, moment_id, user_id,
            profiles:user_id(full_name, avatar_url)
          `)
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
            profiles: { full_name: string | null; avatar_url: string | null } | null;
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
                joined_at: j.created_at,
                read: false,
                moment_id: moment.id,
                moment_type: moment.moment_type,
                moment_title: moment.title,
                full_name: j.profiles?.full_name,
                avatar_url: j.profiles?.avatar_url
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
              joined_at: msg.created_at,
              read: false,
              moment_id: msg.moment_id,
              moment_type: m?.moment_type,
              moment_title: m?.title
            })
          })
        }
      }

      // Sort by timestamp
      results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setNotifications(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSignals = notifications.filter(s => {
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
    <div className="flex-1 overflow-y-auto bg-void">
      <div className="max-w-6xl mx-auto">

        {/* Desktop two-column / Mobile single column */}
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:min-h-screen">

          {/* LEFT — sticky sidebar on desktop */}
          <div className="lg:border-r lg:border-white/8 lg:sticky lg:top-0
            lg:h-screen lg:overflow-y-auto px-6 lg:px-8 pt-10 pb-6">

            {/* Header */}
            <div className="mb-8">
              <p className="micro-caps text-gold mb-2">Activity</p>
              <h1 className="font-serif text-3xl lg:text-4xl text-marble">Signals</h1>
              <p className="text-marble/30 text-sm mt-2 leading-relaxed">
                People who joined your signals in the last 24 hours.
              </p>
            </div>

            {/* Stats cards — desktop only */}
            <div className="hidden lg:flex flex-col gap-3 mb-8">
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <p className="micro-caps text-xs text-marble/35 mb-2">New joins today</p>
                <p className="font-serif text-4xl text-gold">{notifications.length}</p>
              </div>
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <p className="micro-caps text-xs text-marble/35 mb-2">Your active signals</p>
                <p className="font-serif text-4xl text-marble">
                  {[...new Set(notifications.map(n => n.moment_id))].length}
                </p>
              </div>
            </div>

            {/* Info text — desktop */}
            <div className="hidden lg:block mt-auto">
              <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4">
                <p className="micro-caps text-xs text-gold/70 mb-1">Live updates</p>
                <p className="text-marble/40 text-xs leading-relaxed">
                  This feed refreshes automatically every 60 seconds.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — notifications feed */}
          <div className="px-6 lg:px-10 pt-6 lg:pt-10 pb-24">

            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <p className="micro-caps text-gold mb-2">Activity</p>
              <h1 className="font-serif text-4xl text-marble">Signals</h1>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-gold/30
                    flex items-center justify-center animate-pulse">
                    <Zap className="w-4 h-4 text-gold" />
                  </div>
                  <p className="micro-caps text-marble/30">Loading activity...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/4
                  border border-white/8 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-marble/15" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-marble/30 mb-2">
                    No activity yet
                  </p>
                  <p className="text-sm text-marble/20 max-w-xs">
                    When people join your signals, they'll appear here.
                  </p>
                </div>
                <Link to="/app/create">
                  <button className="micro-caps text-sm px-6 py-3 rounded-full
                    bg-white/5 border border-white/10 text-marble/50
                    hover:text-marble hover:border-white/20 transition-all">
                    Create a Signal
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link to={`/app/moment/${n.moment_id}`}>
                      <div className="group flex items-center gap-4
                        bg-white/3 hover:bg-white/6 border border-white/7
                        hover:border-white/15 rounded-2xl px-5 py-4
                        transition-all duration-300 cursor-pointer">

                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-marble/10
                          border border-white/10 overflow-hidden
                          flex items-center justify-center shrink-0">
                          {n.avatar_url ? (
                            <img src={n.avatar_url}
                              className="w-full h-full object-cover"
                              onError={e => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <span className="font-serif text-sm text-marble/50">
                              {(n.full_name ?? 'A')[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-marble text-sm font-medium
                            group-hover:text-gold-pale transition-colors">
                            <span className="text-marble">
                              {n.full_name ?? 'Someone'}
                            </span>
                            <span className="text-marble/40"> joined </span>
                            <span className="text-marble">{n.moment_title}</span>
                          </p>
                          <p className="micro-caps text-xs text-marble/30 mt-0.5">
                            {new Date(n.joined_at).toLocaleDateString('en', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Arrow */}
                        <span className="text-marble/15 group-hover:text-marble/40
                          transition-colors text-lg">→</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
