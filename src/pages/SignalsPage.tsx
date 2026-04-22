import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getActiveMomentsByCreator, getRecentJoins } from '../lib/db/moments'
import { Moment, Participant } from '../types'
import { Bell, Zap, Calendar, Users, MessageSquare, 
  MapPin, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { getSignalImage } from '../lib/signalImage'

interface SignalJoin extends Participant {
  moments: {
    id: string
    title: string
    tags: string[]
    moment_type: 'moment' | 'event'
  } | null
}

export default function SignalsPage() {
  usePageTitle('Signals')
  const { user } = useAuth()
  const [activeMoments, setActiveMoments] = useState<Moment[]>([])
  const [recentJoins, setRecentJoins] = useState<SignalJoin[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'joins' | 'messages'>('all')

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const fetchActivity = async () => {
      try {
        const active = await getActiveMomentsByCreator(user.id)
        setActiveMoments(active)

        if (active.length > 0) {
          const signalIds = active.map(m => m.id)
          const joins = await getRecentJoins(signalIds)
          setRecentJoins(joins as SignalJoin[])
        } else {
          setRecentJoins([])
        }
      } catch (e) {
        console.error('fetchActivity error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
    const interval = setInterval(fetchActivity, 60000)
    return () => clearInterval(interval)
  }, [user])

  const filteredJoins = recentJoins.filter(s => {
    if (filter === 'joins') return true
    if (filter === 'messages') return false
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
            <div className="hidden lg:flex flex-col gap-4 mb-8">
              <div className="glass-panel hairline-all rounded-3xl p-6 shadow-2xl"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05)' }}>
                <p className="micro-caps text-[10px] text-marble/35 mb-3 tracking-widest">New joins today</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-serif text-5xl text-gold">{recentJoins.length}</p>
                  <span className="text-gold/30 text-xs micro-caps">Intercepted</span>
                </div>
              </div>
              <div className="glass-panel hairline-all rounded-3xl p-6 shadow-2xl"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05)' }}>
                <p className="micro-caps text-[10px] text-marble/35 mb-3 tracking-widest">Your active signals</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-serif text-5xl text-marble">{activeMoments.length}</p>
                  <span className="text-marble/20 text-xs micro-caps">Live</span>
                </div>
              </div>
            </div>

            {/* Info text — desktop */}
            <div className="hidden lg:block mt-auto">
              <div className="bg-gold/5 border border-gold/15 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                   <RefreshCw className="w-3 h-3 text-gold/70 animate-spin-slow" />
                   <p className="micro-caps text-[9px] text-gold/70 tracking-widest">Live intelligence</p>
                </div>
                <p className="text-marble/40 text-[11px] leading-relaxed">
                  This feed is synchronizing with local signals every 60 seconds.
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
            ) : (recentJoins.length === 0) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 gap-8 text-center"
              >
                <div className="w-24 h-24 rounded-3xl bg-[#0a0a14]/80
                  border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <Zap className="w-10 h-10 text-marble/10" strokeWidth={1} />
                  <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full" />
                </div>
                <div className="space-y-3">
                  <p className="font-serif text-3xl text-marble/25 tracking-tight">
                    Radio Silence
                  </p>
                  <p className="text-[13px] text-marble/15 max-w-[240px] mx-auto leading-relaxed">
                    When others intercept your signals, their activity will materialize here.
                  </p>
                </div>
                <Link to="/app/create">
                  <button className="micro-caps text-[10px] px-10 py-4 rounded-full
                    bg-marble text-void font-black tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                    Initiate Signal
                  </button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredJoins.map((join, i) => (
                    <motion.div
                      key={join.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link to={`/app/${join.moments?.moment_type === 'event' ? 'event' : 'moment'}/${join.moment_id}`}>
                        <div className="group relative bg-[#0a0a14]/60 backdrop-blur-md border border-white/10 rounded-3xl p-5
                          hover:bg-[#0a0a14]/90 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl"
                          style={{ borderLeft: join.moments?.moment_type === 'event' ? '3px solid #d4af37' : '3px solid #ff0800' }}>
                          
                          {/* Ambient glow */}
                          <div className={cn(
                            "absolute -right-20 -top-20 w-48 h-48 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000",
                            join.moments?.moment_type === 'event' ? "bg-gold" : "bg-crimson-bright"
                          )} />

                          <div className="flex items-center gap-5 relative z-10">
                            {/* Icon / Type indicator */}
                            <div className="relative shrink-0">
                              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10
                                flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105">
                                {join.moments?.moment_type === 'event' ? (
                                  <Calendar className="w-6 h-6 text-gold/30 group-hover:text-gold transition-colors" strokeWidth={1} />
                                ) : (
                                  <Zap className="w-6 h-6 text-crimson/30 group-hover:text-crimson-bright transition-colors" strokeWidth={1} />
                                )}
                              </div>
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-[#0a0a14] flex items-center justify-center shadow-xl",
                                join.moments?.moment_type === 'event' ? "bg-gold" : "bg-crimson-bright"
                              )}>
                                {join.moments?.moment_type === 'event' ? <Calendar className="w-3 h-3 text-void" /> : <Zap className="w-3 h-3 text-void" />}
                              </div>
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-marble/90 text-[14px] font-medium mb-1.5 line-clamp-1 tracking-tight">
                                <span className="text-marble/40">Intercepted:</span> {join.moments?.title ?? 'Signal'}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="micro-caps text-[9px] text-marble/30 tracking-[0.15em]">
                                  {timeAgo(join.joined_at)}
                                </span >
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className={cn(
                                  "micro-caps text-[9px] tracking-[0.15em] font-bold",
                                  join.moments?.moment_type === 'event' ? "text-gold/60" : "text-crimson-bright/60"
                                )}>
                                  {join.moments?.moment_type === 'event' ? '◈ Event' : '⚡ Moment'}
                                </span>
                              </div>
                            </div>

                            <ArrowLeft className="w-5 h-5 text-marble/10 group-hover:text-marble/40 
                              group-hover:translate-x-1.5 transition-all rotate-180" strokeWidth={1.5} />
                          </div>
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
