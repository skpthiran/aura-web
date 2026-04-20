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
import { getSignalImage } from '../lib/signalImage'

export default function HistoryPage() {
  usePageTitle('History')
  const { user } = useAuth()
  const [moments, setMoments] = useState<Moment[]>([])
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set())
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

        // De-duplicate: a moment might be in both if user is creator and participant
        const combined = [...created, ...joined]
        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
        
        unique.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setMoments(unique)
        setAttendedIds(new Set(joined.map(m => m.id)))
      } catch (e) {
        console.error('fetchHistory error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const createdCount = moments.filter(m => m.creator_id === user?.id).length
  const attendedCount = moments.filter(m => attendedIds.has(m.id)).length
  const totalCount = moments.length

  const filtered = filter === 'created'
    ? moments.filter(m => m.creator_id === user?.id)
    : filter === 'attended'
    ? moments.filter(m => attendedIds.has(m.id))
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
            <div className="hidden lg:flex flex-col gap-4 mb-8">
              {[
                { label: 'Total signals', value: totalCount, accent: 'marble' },
                { label: 'Participated', value: attendedCount, accent: 'gold' },
                { label: 'Established', value: createdCount, accent: 'marble' },
              ].map(stat => (
                <div key={stat.label}
                  className="glass-panel hairline-all rounded-3xl px-6 py-5 shadow-2xl"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05)' }}>
                  <p className="micro-caps text-[10px] text-marble/35 mb-2 tracking-widest">{stat.label}</p>
                  <p className={cn(
                    "font-serif text-3xl",
                    stat.accent === 'gold' ? "text-gold" : "text-marble"
                  )}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs — vertical on desktop */}
            <div className="hidden lg:flex flex-col gap-2">
              <p className="micro-caps text-[10px] text-marble/20 mb-2 px-1 tracking-widest uppercase">Archive Filter</p>
              {[
                { key: 'all', label: 'All Signals' },
                { key: 'attended', label: 'Attended' },
                { key: 'created', label: 'Created' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={cn(
                    'text-left px-5 py-3.5 rounded-2xl text-[13px] transition-all duration-300 group relative overflow-hidden',
                    filter === tab.key
                      ? 'bg-marble/10 text-marble border border-white/10 shadow-lg'
                      : 'text-marble/30 hover:text-marble/60 hover:bg-white/4'
                  )}
                >
                  <div className="flex items-center justify-between relative z-10 font-medium">
                    {tab.label}
                    {filter === tab.key && <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(201,168,76,0.6)]" />}
                  </div>
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 gap-8 text-center"
              >
                <div className="w-24 h-24 rounded-3xl bg-[#0a0a14]/80
                  border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <Clock className="w-10 h-10 text-marble/10" strokeWidth={1} />
                  <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full" />
                </div>
                <div className="space-y-3">
                  <p className="font-serif text-3xl text-marble/25 tracking-tight">
                    Void History
                  </p>
                  <p className="text-[13px] text-marble/15 max-w-[240px] mx-auto leading-relaxed">
                    Once your signals expire or complete their projection, they will be archived here.
                  </p>
                </div>
                <Link to="/app/today">
                  <button className="micro-caps text-[10px] px-10 py-4 rounded-full
                    bg-marble text-void font-black tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                    Find Signal
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((item, i) => {
                  const isEvent = item.moment_type === 'event'
                  const isHost = item.creator_id === user?.id
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group relative flex flex-col bg-[#0a0a14]/60 backdrop-blur-md border border-white/10 rounded-3xl
                        overflow-hidden hover:border-white/20 hover:bg-[#0a0a14]/90 shadow-xl
                        transition-all duration-500 cursor-pointer h-full"
                    >
                      {/* Image Preview */}
                      <div className="relative h-44 overflow-hidden">
                        <img 
                          src={getSignalImage(item.id, item.tags, item.moment_type)}
                          className="w-full h-full object-cover grayscale opacity-30 
                            group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000"
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${item.id}/600/400`
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                           <span className={cn(
                             'micro-caps text-[9px] px-2.5 py-1.5 rounded-full border backdrop-blur-md font-bold tracking-widest',
                             isEvent
                               ? 'bg-gold/20 border-gold/40 text-gold'
                               : 'bg-marble/10 border-white/20 text-marble'
                           )}>
                            {isEvent ? '◈ EVENT' : '⚡ MOMENT'}
                          </span>
                        </div>

                        {isHost && (
                           <div className="absolute top-4 right-4">
                             <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-lg">
                               <Users className="w-3.5 h-3.5 text-gold" />
                             </div>
                           </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-4">
                           <p className="micro-caps text-[9px] text-marble/30 mb-2 tracking-[0.2em]">
                             {formatExpired(item.expires_at).toUpperCase()}
                           </p>
                           <h3 className="font-serif text-xl text-marble/90 group-hover:text-gold transition-colors duration-500 line-clamp-2">
                             {item.title}
                           </h3>
                        </div>

                        {item.description && (
                          <p className="text-[13px] text-marble/30 line-clamp-2 leading-relaxed mb-6 flex-1 italic">
                            "{item.description}"
                          </p>
                        )}

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <p className="micro-caps text-[8px] text-marble/20 tracking-[0.1em]">EXPIRED ON</p>
                            <span className="flex items-center gap-2 text-[10px] text-marble/40 font-medium">
                              <Calendar className="w-3 h-3 text-gold/40" />
                              {new Date(item.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {isHost ? (
                               <span className="micro-caps text-[9px] text-gold/60 font-bold bg-gold/10 px-2 py-1 rounded-md">HOST</span>
                             ) : (
                               <span className="micro-caps text-[9px] text-marble/40 font-bold bg-white/5 px-2 py-1 rounded-md">VISITOR</span>
                             )}
                          </div>
                        </div>
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
