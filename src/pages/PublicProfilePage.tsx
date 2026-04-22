import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useFollow } from '../hooks/useFollow'
import { ArrowLeft, Zap, Calendar, Clock, Grid } from 'lucide-react'
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

type TabType = 'moments' | 'events' | 'past'

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFollowing, followersCount, followingCount, loading: followLoading, toggleFollow } = useFollow(userId)

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [activeMoments, setActiveMoments] = useState<Moment[]>([])
  const [pastMoments, setPastMoments] = useState<Moment[]>([])
  const [events, setEvents] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('moments')

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
      const [active, past, evts] = await Promise.all([
        supabase.from('moments').select('*')
          .eq('creator_id', userId).eq('moment_type', 'moment')
          .eq('is_active', true).gte('expires_at', now)
          .order('created_at', { ascending: false }).limit(30),
        supabase.from('moments').select('*')
          .eq('creator_id', userId).eq('moment_type', 'moment')
          .lt('expires_at', now)
          .order('expires_at', { ascending: false }).limit(30),
        supabase.from('moments').select('*')
          .eq('creator_id', userId).eq('moment_type', 'event')
          .order('expires_at', { ascending: false }).limit(30),
      ])
      setActiveMoments((active.data ?? []) as Moment[])
      setPastMoments((past.data ?? []) as Moment[])
      setEvents((evts.data ?? []) as Moment[])
    } finally {
      setLoading(false)
    }
  }

  const displayName = profile?.full_name ?? 'Anonymous'
  const initials = displayName[0]?.toUpperCase() ?? 'A'
  const totalSignals = activeMoments.length + pastMoments.length + events.length

  const tabs: { key: TabType; icon: any; label: string; count: number }[] = [
    { key: 'moments', icon: Grid, label: 'Moments', count: activeMoments.length },
    { key: 'events', icon: Calendar, label: 'Events', count: events.length },
    { key: 'past', icon: Clock, label: 'Past', count: pastMoments.length },
  ]

  const tabMoments = activeTab === 'moments' ? activeMoments
    : activeTab === 'events' ? events
    : pastMoments

  return (
    <div className="flex-1 overflow-y-auto bg-void">
      <div className="max-w-5xl mx-auto">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 lg:px-10 pt-10 pb-6">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full glass-panel hairline-all
              flex items-center justify-center text-marble/40
              hover:text-marble transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-2xl text-marble lg:hidden">
            {profile?.username ? `@${profile.username}` : displayName}
          </h1>
          <div className="w-10" /> {/* spacer */}
        </div>

        {/* TWO COLUMN CONTENT */}
        <div className="lg:flex lg:gap-12 lg:px-10 pb-20">
          
          {/* LEFT SIDE — Sidebar Info (Sticky on desktop) */}
          <div className="lg:w-80 lg:shrink-0 lg:sticky lg:top-8 lg:h-fit">
            <div className="px-5 pb-8 lg:px-0">
              {/* Avatar section */}
              <div className="flex lg:flex-col items-center lg:items-start gap-6 lg:gap-8 mb-8">
                <div className="w-24 h-24 lg:w-40 lg:h-40 rounded-full border-2 border-white/10
                  bg-white/5 overflow-hidden flex items-center justify-center shrink-0
                  relative group">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <span className="font-serif text-3xl lg:text-5xl text-marble/20">{initials}</span>
                  )}
                  <div className="absolute inset-0 bg-void/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-1 lg:w-full">
                  <h2 className="hidden lg:block font-serif text-3xl text-marble mb-2">
                    {profile?.username ? `@${profile.username}` : displayName}
                  </h2>
                  <p className="text-marble font-medium lg:text-lg mb-1">{displayName}</p>
                  {profile?.bio && (
                    <p className="text-marble/50 text-sm leading-relaxed max-w-xs">{profile.bio}</p>
                  )}
                  {profile?.created_at && (
                    <p className="text-marble/20 text-[10px] micro-caps mt-3">
                      Member since {new Date(profile.created_at).toLocaleDateString('en', {
                        month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats - Grid layout */}
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-4 lg:gap-6 mb-8 py-6 lg:py-8 border-y border-white/5">
                {[
                  { value: totalSignals, label: 'Signals' },
                  { value: followersCount, label: 'Followers' },
                  { value: followingCount, label: 'Following' },
                  { value: events.length, label: 'Events' },
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center lg:items-start">
                    <p className="font-serif text-xl lg:text-3xl text-marble mb-1">
                      {stat.value}
                    </p>
                    <p className="text-marble/30 text-[10px] micro-caps tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {user && userId !== user.id && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={cn(
                    'w-full py-3.5 rounded-xl micro-caps text-sm font-semibold transition-all duration-500',
                    'border border-transparent shadow-lg',
                    isFollowing
                      ? 'bg-white/5 border-white/10 text-marble/40 hover:bg-red-900/10 hover:border-red-500/30 hover:text-red-400'
                      : 'bg-marble text-void hover:bg-gold shadow-gold/10'
                  )}
                >
                  {followLoading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDE — Tabs + Grid */}
          <div className="flex-1">
            <div className="sticky top-0 z-20 bg-void/80 backdrop-blur-xl border-b border-white/5 px-5 lg:px-0">
              <div className="flex gap-8">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 py-4 transition-all duration-300 relative group',
                      activeTab === tab.key
                        ? 'text-marble'
                        : 'text-marble/30 hover:text-marble/60'
                    )}
                  >
                    <tab.icon className={cn(
                      'w-4 h-4 transition-transform duration-300',
                      activeTab === tab.key ? 'scale-110' : 'group-hover:scale-110'
                    )} />
                    <span className="micro-caps text-xs">{tab.label}</span>
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="activeTabProfile"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTENT GRID */}
            <div className="p-0.5 lg:p-0 lg:pt-8 min-h-[50vh]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-gold animate-spin" />
                  <p className="micro-caps text-marble/20">Refining View...</p>
                </div>
              ) : tabMoments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-10">
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center opacity-20">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-marble/30 mb-2">Null Presence</h3>
                    <p className="text-marble/15 text-sm max-w-xs mx-auto italic">
                      No metadata found for {activeTab} in this frequency.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 lg:grid-cols-3 gap-1 lg:gap-4">
                  {tabMoments.map((moment) => {
                    const isExpired = new Date(moment.expires_at) < new Date()
                    const isEvent = moment.moment_type === 'event'
                    return (
                      <Link key={moment.id} to={`/app/${isEvent ? 'event' : 'moment'}/${moment.id}`}>
                        <div className={cn(
                          "relative aspect-square overflow-hidden bg-white/5 cursor-pointer group",
                          "rounded-sm lg:rounded-xl border border-transparent transition-all duration-500",
                          "hover:border-white/10 hover:shadow-2xl hover:-translate-y-1"
                        )}>
                          <img
                            src={`https://picsum.photos/seed/${moment.id}/600/600`}
                            className="w-full h-full object-cover
                              group-hover:scale-110 transition-transform duration-700"
                            alt={moment.title}
                          />
                          
                          {/* OVERLAY */}
                          <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent 
                            opacity-0 group-hover:opacity-100 transition-all duration-500" />
                          
                          <div className="absolute inset-x-0 bottom-0 p-3 lg:p-6 translate-y-4 group-hover:translate-y-0
                            opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
                            <p className="font-serif text-white text-xs lg:text-base leading-tight">
                              {moment.title}
                            </p>
                          </div>

                          <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-10">
                            <span className={cn(
                              'w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold backdrop-blur-md',
                              isExpired
                                ? 'bg-black/40 text-white/40'
                                : isEvent
                                  ? 'bg-gold/80 text-void border border-gold/50'
                                  : 'bg-red-500/80 text-white border border-red-400/50'
                            )}>
                              {isEvent ? '◈' : '⚡'}
                            </span>
                          </div>
                          
                          {isExpired && (
                            <div className="absolute inset-0 bg-black/60 backdrop-grayscale" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
