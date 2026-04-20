import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getActiveMomentsByCreator, getRecentJoins } from '../lib/db/moments'
import { Moment, Participant } from '../types'
import { Bell, Zap, Calendar, Users, MessageSquare, 
  MapPin, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

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
            <div className="hidden lg:flex flex-col gap-3 mb-8">
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <p className="micro-caps text-xs text-marble/35 mb-2">New joins today</p>
                <p className="font-serif text-4xl text-gold">{recentJoins.length}</p>
              </div>
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <p className="micro-caps text-xs text-marble/35 mb-2">Your active signals</p>
                <p className="font-serif text-4xl text-marble">
                  {activeMoments.length}
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
            ) : (recentJoins.length === 0) ? (
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
                {filteredJoins.map((join) => (
                  <motion.div
                    key={join.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Link to={`/app/moment/${join.moment_id}`}>
                      <div className="group flex items-center gap-4
                        bg-white/3 hover:bg-white/6 border border-white/7
                        hover:border-white/15 rounded-2xl px-5 py-4
                        transition-all duration-300 cursor-pointer">

                        {/* Icon/Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gold/10
                          border border-white/10 overflow-hidden
                          flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-gold/50" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-marble text-sm font-medium
                            group-hover:text-gold-pale transition-colors">
                            Someone joined <span className="text-gold">
                              {join.moments?.title ?? 'your signal'}
                            </span>
                          </p>
                          <p className="micro-caps text-xs text-marble/30 mt-0.5">
                            {new Date(join.joined_at).toLocaleTimeString([], {
                              hour: '2-digit', minute: '2-digit',
                              month: 'short', day: 'numeric'
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
