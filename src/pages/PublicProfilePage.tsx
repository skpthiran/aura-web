import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { ArrowLeft, User, MapPin, Calendar, 
  Zap, Users, Clock } from 'lucide-react'
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

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'moments' | 'events'>('moments')

  usePageTitle(profile?.full_name ?? 'Profile')

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (userId && user && userId === user.id) {
      navigate('/app/profile', { replace: true })
    }
  }, [userId, user, navigate])

  useEffect(() => {
    if (!userId) return
    fetchProfile()
    fetchUserMoments()
  }, [userId])

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, bio, avatar_url, created_at')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as PublicProfile)
  }

  const fetchUserMoments = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)
      setMoments((data ?? []) as Moment[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMoments = moments.filter(m =>
    activeTab === 'moments' 
      ? m.moment_type === 'moment'
      : m.moment_type === 'event'
  )

  const displayName = profile?.full_name ?? 'Anonymous'
  const initials = displayName[0]?.toUpperCase() ?? 'A'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en', {
        month: 'long', year: 'numeric'
      })
    : ''

  return (
    <div className="flex-1 overflow-y-auto bg-void">

      {/* Header banner */}
      <div className="relative overflow-hidden" 
        style={{ height: '220px' }}>
        <div className="absolute inset-0 bg-gradient-to-br 
          from-void via-obsidian to-black" />
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-64 h-64
            bg-gold/8 rounded-full blur-[80px]" />
        </div>
        {/* Back button */}
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

      {/* Profile section */}
      <div className="max-w-2xl mx-auto px-6">
        
        {/* Avatar — overlaps banner */}
        <div className="flex items-end justify-between -mt-12 mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-void
            bg-marble/10 overflow-hidden flex items-center justify-center
            shadow-xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <span className="font-serif text-3xl text-marble/60">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Name + bio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl text-marble mb-1">
            {displayName}
          </h1>
          {profile?.username && (
            <p className="micro-caps text-sm text-marble/40 mb-3">
              @{profile.username}
            </p>
          )}
          {profile?.bio && (
            <p className="text-marble/50 text-sm leading-relaxed mb-4 
              max-w-md">
              {profile.bio}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-marble/30">
            <span className="flex items-center gap-1.5 micro-caps">
              <Calendar className="w-3.5 h-3.5" />
              Member since {memberSince}
            </span>
            <span className="flex items-center gap-1.5 micro-caps">
              <Zap className="w-3.5 h-3.5" />
              {moments.length} active signals
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: 'Moments', value: moments.filter(m => m.moment_type === 'moment').length },
            { label: 'Events', value: moments.filter(m => m.moment_type === 'event').length },
            { label: 'Total', value: moments.length },
          ].map(stat => (
            <div key={stat.label}
              className="glass-panel hairline-all rounded-2xl p-4 text-center">
              <p className="font-serif text-2xl text-marble mb-1">
                {stat.value}
              </p>
              <p className="micro-caps text-xs text-marble/30">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Tab filter */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'moments', label: '⚡ Moments' },
            { key: 'events', label: '◈ Events' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'moments' | 'events')}
              className={cn(
                'micro-caps text-xs px-5 py-2.5 rounded-full transition-all',
                activeTab === tab.key
                  ? 'bg-marble text-void font-medium'
                  : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Moments grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="micro-caps text-marble/30">Loading signals...</p>
          </div>
        ) : filteredMoments.length === 0 ? (
          <div className="flex flex-col items-center justify-center 
            py-16 gap-4 text-center">
            <div className="w-14 h-14 rounded-full glass-panel hairline-all
              flex items-center justify-center">
              <Zap className="w-5 h-5 text-marble/20" />
            </div>
            <p className="font-serif text-xl text-marble/30">
              No {activeTab} yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-10">
            {filteredMoments.map((moment, i) => {
              const isEvent = moment.moment_type === 'event'
              const hoursLeft = Math.max(0, Math.round(
                (new Date(moment.expires_at).getTime() - Date.now()) / 3600000
              ))
              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={`/app/moment/${moment.id}`}>
                    <div className={cn(
                      'relative overflow-hidden rounded-2xl group cursor-pointer',
                      'border transition-all duration-500',
                      isEvent
                        ? 'border-gold/20 hover:border-gold/50'
                        : 'border-white/8 hover:border-crimson/30'
                    )}
                    style={{ minHeight: '160px' }}>
                      <img
                        src={`https://picsum.photos/seed/${moment.id}/800/300`}
                        className="absolute inset-0 w-full h-full object-cover
                          group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.currentTarget.style.opacity = '0' }}
                      />
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)' }}
                      />
                      <div className="relative z-10 p-5 h-full flex 
                        flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <span className={cn(
                            'micro-caps text-xs px-3 py-1 rounded-full border',
                            isEvent
                              ? 'bg-gold/15 border-gold/40 text-gold'
                              : 'bg-red-900/20 border-red-500/40 text-red-400'
                          )}>
                            {isEvent ? '◈ Event' : '⚡ Moment'}
                          </span>
                          <span className="micro-caps text-xs text-white/30">
                            {hoursLeft}h left
                          </span>
                        </div>
                        <div>
                          <h3 className="font-serif text-xl text-white mb-2
                            group-hover:text-gold-pale transition-colors">
                            {moment.title}
                          </h3>
                          <div className="flex items-center gap-3
                            text-white/40 text-xs micro-caps">
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
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
