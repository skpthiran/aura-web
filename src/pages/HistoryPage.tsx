import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { usePageTitle } from '../hooks/usePageTitle'
import { Clock, Zap, Calendar, Users } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'

interface HistoryMoment {
  id: string
  title: string
  description: string | null
  moment_type: 'moment' | 'event'
  expires_at: string
  created_at: string
  capacity_limit: number
  tags: string[]
  latitude: number
  longitude: number
  joined_at: string
  was_creator: boolean
}

export default function HistoryPage() {
  usePageTitle('History')
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryMoment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'attended' | 'created'>('all')

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    if (!user) return
    setLoading(true)
    try {
      const results: HistoryMoment[] = []

      // 1. Moments user joined (attended)
      const { data: joined } = await supabase
        .from('participants')
        .select('moment_id, created_at, status')
        .eq('user_id', user.id)
        .in('status', ['joined', 'waitlist'])

      if (joined && joined.length > 0) {
        const momentIds = joined.map((j: any) => j.moment_id)
        const { data: attendedMoments } = await supabase
          .from('moments')
          .select('*')
          .in('id', momentIds)
          .lt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })

        if (attendedMoments) {
          attendedMoments.forEach((m: any) => {
            const participation = joined.find((j: any) => j.moment_id === m.id)
            results.push({
              ...m,
              joined_at: participation?.created_at ?? m.created_at,
              was_creator: m.creator_id === user.id,
            } as HistoryMoment)
          })
        }
      }

      // 2. Moments user created that are expired (not already in list)
      const { data: created } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', user.id)
        .lt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })

      if (created) {
        created.forEach((m: any) => {
          const alreadyIn = results.find(r => r.id === m.id)
          if (!alreadyIn) {
            results.push({
              ...m,
              joined_at: m.created_at,
              was_creator: true,
            } as HistoryMoment)
          } else {
            // Mark as creator if it's in both lists
            const existing = results.find(r => r.id === m.id)
            if (existing) existing.was_creator = true
          }
        })
      }

      // Sort by expires_at descending
      results.sort((a, b) =>
        new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
      )
      setHistory(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = history.filter(h => {
    if (filter === 'attended') return !h.was_creator
    if (filter === 'created') return h.was_creator
    return true
  })

  const formatExpired = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Expired today'
    if (diffDays === 1) return 'Expired yesterday'
    if (diffDays < 7) return `Expired ${diffDays} days ago`
    if (diffDays < 30) return `Expired ${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="micro-caps text-gold mb-2">Archive</p>
          <h1 className="font-serif text-4xl text-marble">Signal History</h1>
          <p className="text-marble/30 text-sm mt-2">
            Moments you attended or created that have expired.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'all', label: 'All' },
            { key: 'attended', label: 'Attended' },
            { key: 'created', label: 'Created' },
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
              {!loading && (
                <span className="ml-2 text-current opacity-40">
                  ({filter === tab.key ? filtered.length : (
                    tab.key === 'all' ? history.length :
                    tab.key === 'attended' ? history.filter(h => !h.was_creator).length :
                    history.filter(h => h.was_creator).length
                  )})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-6 h-6 text-gold animate-pulse" />
              <p className="micro-caps text-marble/30">Loading history...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-full glass-panel hairline-all
              flex items-center justify-center">
              <Clock className="w-6 h-6 text-marble/20" />
            </div>
            <div>
              <p className="font-serif text-2xl text-marble/30 mb-2">
                No history yet
              </p>
              <p className="text-sm text-marble/20 max-w-xs">
                Signals you attend or create will appear here after they expire.
              </p>
            </div>
            <Link to="/app/today">
              <button className="micro-caps text-sm px-6 py-3
                glass-panel hairline-all rounded-full text-marble/50
                hover:text-marble transition-all">
                Discover Signals
              </button>
            </Link>
          </motion.div>
        )}

        {/* History list */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((item, i) => {
              const isEvent = item.moment_type === 'event'
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel hairline-all rounded-2xl overflow-hidden
                    opacity-80 hover:opacity-100 transition-all duration-300 group"
                >
                  {/* Top color strip */}
                  <div className={cn(
                    'h-0.5 w-full',
                    isEvent ? 'bg-gold/30' : 'bg-red-500/30'
                  )} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'micro-caps text-xs px-3 py-1 rounded-full border',
                          isEvent
                            ? 'bg-gold/10 border-gold/25 text-gold/70'
                            : 'bg-red-900/15 border-red-500/25 text-red-400/70'
                        )}>
                          {isEvent ? '◈ Event' : '⚡ Moment'}
                        </span>
                        {item.was_creator && (
                          <span className="micro-caps text-xs px-3 py-1 rounded-full
                            bg-white/5 border border-white/10 text-marble/40">
                            Created by you
                          </span>
                        )}
                      </div>
                      <span className="micro-caps text-xs text-marble/25 shrink-0 ml-2">
                        {formatExpired(item.expires_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-xl text-marble/70
                      group-hover:text-marble transition-colors mb-1">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-marble/30 leading-relaxed mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-marble/25 micro-caps">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.expires_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        {item.capacity_limit} capacity
                      </span>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.slice(0, 4).map(tag => (
                          <span key={tag}
                            className="micro-caps text-xs px-2.5 py-1 rounded-full
                              bg-white/4 border border-white/8 text-marble/30">
                            {tag}
                          </span>
                        ))}
                      </div>
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
