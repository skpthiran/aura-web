import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getCreatedMoments, getJoinedMomentsHistory } from '../lib/db/moments'
import { Moment } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'
import { Clock, Zap, Calendar, Users } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { HistoryCardSkeleton } from '../components/Skeleton'

export default function HistoryPage() {
  usePageTitle('History')
  const { user } = useAuth()
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'attended' | 'created'>('all')

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const fetchHistory = async () => {
      try {
        const [created, joined] = await Promise.all([
          getCreatedMoments(user.id),
          getJoinedMomentsHistory(user.id)
        ])

        const all = [...created, ...joined]
        all.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setMoments(all)
      } catch (e) {
        console.error('fetchHistory error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const createdCount = moments.filter(m => m.creator_id === user?.id).length
  const attendedCount = moments.filter(m => m.creator_id !== user?.id).length
  const totalCount = moments.length

  const filtered = filter === 'created'
    ? moments.filter(m => m.creator_id === user?.id)
    : filter === 'attended'
    ? moments.filter(m => m.creator_id !== user?.id)
    : moments

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
    <div className="flex-1 overflow-y-auto bg-void">
      <div className="max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:min-h-screen">

          {/* LEFT sidebar */}
          <div className="lg:border-r lg:border-white/8 lg:sticky lg:top-0
            lg:h-screen lg:overflow-y-auto px-6 lg:px-8 pt-10 pb-6">

            <div className="mb-8">
              <p className="micro-caps text-gold mb-2">Archive</p>
              <h1 className="font-serif text-3xl lg:text-4xl text-marble">
                Signal History
              </h1>
              <p className="text-marble/30 text-sm mt-2 leading-relaxed">
                Moments you attended or created that have expired.
              </p>
            </div>

            {/* Stats — desktop */}
            <div className="hidden lg:flex flex-col gap-3 mb-8">
              {[
                { label: 'Total signals', value: totalCount },
                { label: 'Attended', value: attendedCount },
                { label: 'Created', value: createdCount },
              ].map(stat => (
                <div key={stat.label}
                  className="bg-white/4 border border-white/8 rounded-2xl px-5 py-4
                    flex items-center justify-between">
                  <p className="micro-caps text-xs text-marble/35">{stat.label}</p>
                  <p className="font-serif text-2xl text-marble">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs — vertical on desktop */}
            <div className="hidden lg:flex flex-col gap-2">
              <p className="micro-caps text-xs text-marble/25 mb-1 px-1">Filter</p>
              {[
                { key: 'all', label: 'All Signals' },
                { key: 'attended', label: 'Attended' },
                { key: 'created', label: 'Created' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={cn(
                    'text-left px-4 py-3 rounded-xl text-sm transition-all',
                    filter === tab.key
                      ? 'bg-marble/10 text-marble border border-white/15'
                      : 'text-marble/35 hover:text-marble/60 hover:bg-white/4'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — content */}
          <div className="px-6 lg:px-10 pt-6 lg:pt-10 pb-24">

            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <p className="micro-caps text-gold mb-2">Archive</p>
              <h1 className="font-serif text-4xl text-marble">Signal History</h1>
            </div>

            {/* Mobile filter tabs */}
            <div className="flex lg:hidden gap-2 mb-8">
              {[
                { key: 'all', label: 'All' },
                { key: 'attended', label: 'Attended' },
                { key: 'created', label: 'Created' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={cn(
                    'micro-caps text-xs px-5 py-2 rounded-full transition-all',
                    filter === tab.key
                      ? 'bg-marble text-void font-medium'
                      : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <HistoryCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/4
                  border border-white/8 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-marble/15" />
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
                  <button className="micro-caps text-sm px-6 py-3 rounded-full
                    bg-white/5 border border-white/10 text-marble/50
                    hover:text-marble hover:border-white/20 transition-all">
                    Discover Signals
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((item, i) => {
                  const isEvent = item.moment_type === 'event'
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative overflow-hidden rounded-2xl
                        border border-white/7 hover:border-white/15
                        bg-white/3 hover:bg-white/5
                        transition-all duration-300 cursor-pointer"
                    >
                      {/* Color strip top */}
                      <div className={cn(
                        'h-0.5 w-full',
                        isEvent ? 'bg-gold/30' : 'bg-red-500/25'
                      )} />

                      <div className="p-5 lg:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">

                            {/* Badges row */}
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              <span className={cn(
                                'micro-caps text-xs px-3 py-1 rounded-full border',
                                isEvent
                                  ? 'bg-gold/8 border-gold/20 text-gold/70'
                                  : 'bg-red-900/15 border-red-500/20 text-red-400/70'
                              )}>
                                {isEvent ? '◈ Event' : '⚡ Moment'}
                              </span>
                              {item.creator_id === user?.id && (
                                <span className="micro-caps text-xs px-3 py-1 rounded-full
                                  bg-white/5 border border-white/10 text-marble/35">
                                  Hosted by you
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="font-serif text-xl lg:text-2xl text-marble/70
                              group-hover:text-marble transition-colors mb-2">
                              {item.title}
                            </h3>

                            {/* Description */}
                            {item.description && (
                              <p className="text-sm text-marble/30 line-clamp-2
                                leading-relaxed mb-3">
                                {item.description}
                              </p>
                            )}

                            {/* Meta */}
                            <div className="flex items-center flex-wrap gap-4
                              text-xs text-marble/25 micro-caps">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {formatDate(item.expires_at)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                {item.capacity_limit} capacity
                              </span>
                            </div>
                          </div>

                          {/* Right — expiry badge */}
                          <div className="shrink-0 text-right">
                            <span className="micro-caps text-xs text-marble/25
                              bg-white/4 border border-white/8 rounded-full
                              px-3 py-1.5 whitespace-nowrap">
                              {formatExpired(item.expires_at)}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {item.tags.slice(0, 5).map(tag => (
                              <span key={tag}
                                className="micro-caps text-xs px-2.5 py-1 rounded-full
                                  bg-white/4 border border-white/8 text-marble/30">
                                #{tag}
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
      </div>
    </div>
  )
}
