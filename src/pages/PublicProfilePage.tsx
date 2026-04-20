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
  const { isFollowing, followerCount, followingCount, loading: followLoading, toggle } = useFollow(userId)

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
      <div className="max-w-lg mx-auto">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 pt-10 pb-6">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full glass-panel hairline-all
              flex items-center justify-center text-marble/40
              hover:text-marble transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif text-xl text-marble">
            {profile?.username ? `@${profile.username}` : displayName}
          </h1>
          <div className="w-9" /> {/* spacer */}
        </div>

        {/* PROFILE HEADER */}
        <div className="px-5 pb-6">

          {/* Avatar + Stats row */}
          <div className="flex items-center gap-6 mb-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border-2 border-white/15
              bg-marble/10 overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <span className="font-serif text-2xl text-marble/60">{initials}</span>
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-4 gap-1">
              {[
                { value: totalSignals, label: 'Signals' },
                { value: followerCount, label: 'Followers' },
                { value: followingCount, label: 'Following' },
                { value: events.length, label: 'Events' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <p className="font-semibold text-marble text-lg leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-marble/40 text-[10px] leading-none">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Name + bio */}
          <div className="mb-5">
            <p className="text-marble font-semibold text-sm mb-0.5">{displayName}</p>
            {profile?.bio && (
              <p className="text-marble/50 text-sm leading-relaxed">{profile.bio}</p>
            )}
            {profile?.created_at && (
              <p className="text-marble/25 text-xs mt-1">
                Member since {new Date(profile.created_at).toLocaleDateString('en', {
                  month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* Follow button */}
          {user && userId !== user.id && (
            <button
              onClick={toggle}
              disabled={followLoading}
              className={cn(
                'w-full py-2.5 rounded-xl micro-caps text-sm font-medium transition-all duration-300',
                isFollowing
                  ? 'bg-white/8 border border-white/15 text-marble/60 hover:bg-red-900/15 hover:border-red-500/25 hover:text-red-400'
                  : 'bg-marble text-void hover:bg-gold hover:text-void'
              )}
            >
              {followLoading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
            </button>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-white/8" />

        {/* TABS */}
        <div className="flex border-b border-white/8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-all',
                'border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-marble text-marble'
                  : 'border-transparent text-marble/25 hover:text-marble/50'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="micro-caps text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="micro-caps text-marble/30">Loading...</p>
          </div>
        ) : tabMoments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <Zap className="w-6 h-6 text-marble/15" />
            <p className="font-serif text-xl text-marble/25">
              No {activeTab} yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {tabMoments.map((moment) => {
              const isExpired = new Date(moment.expires_at) < new Date()
              const isEvent = moment.moment_type === 'event'
              return (
                <Link key={moment.id} to={`/app/moment/${moment.id}`}>
                  <div className="relative aspect-square overflow-hidden
                    bg-white/5 group cursor-pointer">
                    <img
                      src={`https://picsum.photos/seed/${moment.id}/400/400`}
                      className="w-full h-full object-cover
                        group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.style.opacity = '0' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50
                      transition-all duration-300 flex items-center justify-center">
                      <p className="opacity-0 group-hover:opacity-100 transition-opacity
                        font-serif text-white text-xs text-center px-2 leading-tight">
                        {moment.title}
                      </p>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                        isExpired
                          ? 'bg-black/60 text-white/40'
                          : isEvent
                            ? 'bg-gold/80 text-void'
                            : 'bg-red-500/80 text-white'
                      )}>
                        {isEvent ? '◈' : '⚡'}
                      </span>
                    </div>
                    {isExpired && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}
