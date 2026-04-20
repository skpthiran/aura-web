import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { ArrowLeft, Zap, Calendar, Users, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'

interface PublicProfile {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

type TabType = 'active' | 'past' | 'events'

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [activeMoments, setActiveMoments] = useState<Moment[]>([])
  const [pastMoments, setPastMoments] = useState<Moment[]>([])
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('active')

  usePageTitle(profile?.full_name ?? 'Profile')

  useEffect(() => {
    if (userId && user && userId === user.id) {
      navigate('/app/profile', { replace: true })
    }
  }, [userId, user, navigate])

  useEffect(() => {
    if (!userId) return
    fetchProfile()
    fetchAllMoments()
  }, [userId])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, bio, avatar_url, created_at')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as PublicProfile)
  }

  const fetchAllMoments = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()

      // Active moments (not events)
      const { data: active } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', userId)
        .eq('moment_type', 'moment')
        .eq('is_active', true)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(30)
      setActiveMoments((active ?? []) as Moment[])

      // Past moments (expired, not events)
      const { data: past } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', userId)
        .eq('moment_type', 'moment')
        .lt('expires_at', now)
        .order('expires_at', { ascending: false })
        .limit(30)
      setPastMoments((past ?? []) as Moment[])

      // All events (active + past)
      const { data: evts } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', userId)
        .eq('moment_type', 'event')
        .order('expires_at', { ascending: false })
        .limit(30)
      setEvents((evts ?? []) as Moment[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const displayName = profile?.full_name ?? 'Anonymous'
  const initials = displayName[0]?.toUpperCase() ?? 'A'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en', {
        month: 'long', year: 'numeric'
      })
    : ''

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: '⚡ Active', count: activeMoments.length },
    { key: 'past', label: '◷ Past', count: pastMoments.length },
    { key: 'events', label: '◈ Events', count: events.length },
  ]

  const formatExpired = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Expired today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const hoursLeft = (dateStr: string) =>
    Math.max(0, Math.round((new Date(dateStr).getTime() - Date.now()) / 3600000))

  // Render a signal card
  const SignalCard = ({ moment, isPast = false }: { moment: Moment; isPast?: boolean }) => {
    const isEvent = moment.moment_type === 'event'
    const expired = new Date(moment.expires_at) < new Date()

    return (
      <Link to={`/app/moment/${moment.id}`}>
        <div className={cn(
          'relative overflow-hidden rounded-2xl border transition-all duration-500 group cursor-pointer',
          isPast || expired
            ? 'border-white/6 opacity-60 hover:opacity-90'
            : isEvent
              ? 'border-gold/20 hover:border-gold/50'
              : 'border-white/8 hover:border-crimson/30'
        )}
        style={{ minHeight: '140px' }}>
          <img
            src={`https://picsum.photos/seed/${moment.id}/800/300`}
            className="absolute inset-0 w-full h-full object-cover
              group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.currentTarget.style.opacity = '0' }}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 100%)' }}
          />

          {/* Expired overlay tint */}
          {(isPast || expired) && (
            <div className="absolute inset-0 bg-black/30" />
          )}

          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className={cn(
                'micro-caps text-xs px-3 py-1 rounded-full border',
                isPast || expired
                  ? 'bg-white/5 border-white/15 text-white/40'
                  : isEvent
                    ? 'bg-gold/15 border-gold/40 text-gold'
                    : 'bg-red-900/20 border-red-500/40 text-red-400'
              )}>
                {isPast || expired
                  ? (isEvent ? '◈ Past Event' : '⚡ Past Signal')
                  : (isEvent ? '◈ Event' : '⚡ Moment')}
              </span>
              <span className="micro-caps text-xs text-white/30">
                {isPast || expired
                  ? formatExpired(moment.expires_at)
                  : `${hoursLeft(moment.expires_at)}h left`}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg text-white mb-1.5
                group-hover:text-gold-pale transition-colors leading-tight">
                {moment.title}
              </h3>
              {moment.description && (
                <p className="text-xs text-white/35 line-clamp-1 mb-2">
                  {moment.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-white/30 text-xs micro-caps">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {moment.capacity_limit} capacity
                </span>
                {moment.tags?.slice(0, 2).map(tag => (
                  <span key={tag}>· {tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-void">

      {/* Header banner */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-void via-obsidian to-black" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-gold/6 rounded-full blur-[90px]" />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full
            bg-black/40 backdrop-blur-md border border-white/15
            flex items-center justify-center text-white/70
            hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6">

        {/* Avatar overlapping banner */}
        <div className="flex items-end justify-between -mt-14 mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-void
            bg-marble/10 overflow-hidden flex items-center justify-center shadow-xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <span className="font-serif text-3xl text-marble/60">{initials}</span>
            )}
          </div>
        </div>

        {/* Name + bio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl text-marble mb-1">{displayName}</h1>
          {profile?.username && (
            <p className="micro-caps text-sm text-marble/40 mb-3">
              @{profile.username}
            </p>
          )}
          {profile?.bio && (
            <p className="text-marble/50 text-sm leading-relaxed mb-4 max-w-md">
              {profile.bio}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-marble/25">
            <span className="flex items-center gap-1.5 micro-caps">
              <Calendar className="w-3.5 h-3.5" />
              Since {memberSince}
            </span>
            <span className="flex items-center gap-1.5 micro-caps">
              <Zap className="w-3.5 h-3.5" />
              {activeMoments.length + pastMoments.length + events.length} total signals
            </span>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: 'Active', value: activeMoments.length },
            { label: 'Past', value: pastMoments.length },
            { label: 'Events', value: events.length },
          ].map(stat => (
            <div key={stat.label}
              className="glass-panel hairline-all rounded-2xl p-4 text-center">
              <p className="font-serif text-2xl text-marble mb-1">{stat.value}</p>
              <p className="micro-caps text-xs text-marble/30">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'micro-caps text-xs px-5 py-2.5 rounded-full transition-all whitespace-nowrap shrink-0',
                activeTab === tab.key
                  ? 'bg-marble text-void font-medium'
                  : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
              )}
            >
              {tab.label}
              <span className="ml-2 opacity-50">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="micro-caps text-marble/30">Loading signals...</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 pb-10"
          >
            {/* Active tab */}
            {activeTab === 'active' && (
              activeMoments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Zap className="w-6 h-6 text-marble/15" />
                  <p className="font-serif text-xl text-marble/30">No active signals</p>
                </div>
              ) : (
                activeMoments.map(m => <SignalCard key={m.id} moment={m} />)
              )
            )}

            {/* Past tab */}
            {activeTab === 'past' && (
              pastMoments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Clock className="w-6 h-6 text-marble/15" />
                  <p className="font-serif text-xl text-marble/30">No past signals yet</p>
                </div>
              ) : (
                pastMoments.map(m => <SignalCard key={m.id} moment={m} isPast={true} />)
              )
            )}

            {/* Events tab */}
            {activeTab === 'events' && (
              events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Calendar className="w-6 h-6 text-marble/15" />
                  <p className="font-serif text-xl text-marble/30">No events hosted</p>
                </div>
              ) : (
                events.map(m => (
                  <SignalCard
                    key={m.id}
                    moment={m}
                    isPast={new Date(m.expires_at) < new Date()}
                  />
                ))
              )
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
