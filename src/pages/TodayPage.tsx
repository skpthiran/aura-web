import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Users, Loader, MapPin, Zap, Search, ArrowRight, Clock, Compass } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ToastProvider'
import { useRealtimeMoments } from '../hooks/useRealtimeMoments'
import { calculateDistance } from '../lib/utils'

interface MomentGridCardProps {
  moment: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void
  onReject: () => void
}

const MomentGridCard: React.FC<MomentGridCardProps> = ({ 
  moment, 
  index,
  isJoined, 
  isJoining, 
  onJoin, 
  onReject 
}) => {
  const isEvent = moment.moment_type === 'event'
  
  const distanceDisplay = useMemo(() => {
    if (!moment.distance_meters) return 'nearby'
    return moment.distance_meters < 1000
      ? `${Math.round(moment.distance_meters)}m`
      : `${(moment.distance_meters / 1000).toFixed(1)}km`
  }, [moment.distance_meters])

  const timeDisplay = useMemo(() => {
    if (!moment.expires_at) return 'limited'
    const now = new Date().getTime()
    const expires = new Date(moment.expires_at).getTime()
    const diff = expires - now
    if (diff <= 0) return 'expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }, [moment.expires_at])

  return (
    <Link to={`/app/moment/${moment.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * (index % 5), duration: 0.6 }}
        className="group relative h-[450px] overflow-hidden rounded-2xl border border-white/5 
          hover:border-white/10 transition-all duration-500 cursor-pointer"
      >
        <img
          src={`https://picsum.photos/seed/${moment.id}/800/1200`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
          alt={moment.title}
          onError={(e) => { 
            e.currentTarget.style.opacity = '0'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className={cn(
            "micro-caps text-[10px] px-2.5 py-1 rounded-full border backdrop-blur-md",
            isEvent ? "bg-gold/10 border-gold/40 text-gold" : "bg-crimson/10 border-crimson/40 text-crimson-bright"
          )}>
            {isEvent ? '◈ Event' : '⚡ Moment'}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <h3 className="font-serif text-2xl text-white mb-3 group-hover:text-gold-pale transition-colors">
            {moment.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] micro-caps text-white/40">
              <span className="flex items-center gap-1"><Users size={10} /> {moment.participant_count ?? 0}</span>
              <span>{distanceDisplay}</span>
              <span>{timeDisplay}</span>
            </div>
            
            <div className="flex gap-2">
              {!isJoined && (
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation(); 
                    onReject(); 
                  }}
                  className="micro-caps text-[10px] px-4 py-2 rounded-full 
                    border border-white/20 text-marble/60 
                    hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 
                    transition-all duration-300"
                >
                  Reject
                </button>
              )}
              <button
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  onJoin(); 
                }}
                disabled={isJoined || isJoining}
                className={cn(
                  "micro-caps text-[10px] px-4 py-2 rounded-full transition-all duration-300",
                  isJoined 
                    ? "bg-gold/20 text-gold border border-gold/40 cursor-default" 
                    : "bg-white text-void hover:bg-green-400 hover:text-void hover:shadow-lg hover:shadow-green-400/20 font-medium"
                )}
              >
                {isJoining ? '...' : isJoined ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function TodayPage() {
  usePageTitle('Pulse')
  const { user } = useAuth()
  const { location } = useUserLocation()
  const [activeTab, setActiveTab] = useState('All')
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [radius, setRadius] = useState<number>(50000) // default 50km
  const [radiusOpen, setRadiusOpen] = useState(false)
  
  const radiusOptions = [
    { label: '5 KM', value: 5000 },
    { label: '50 KM', value: 50000 },
    { label: 'Province', value: 150000 },
    { label: 'Country', value: 500000 },
    { label: 'Global', value: 99999999 },
  ]

  const { moments, loading, setMoments } = useNearbyMoments(location, radius)
  const { addToast } = useToast()

  // Realtime Integration
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    // Sync state
    setMoments(prev => {
      const idx = prev.findIndex(m => m.id === newMoment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newMoment
        return next
      }
      return [newMoment, ...prev]
    })

    // Notify if nearby
    if (location && newMoment.latitude !== undefined && newMoment.longitude !== undefined) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        newMoment.latitude,
        newMoment.longitude
      )
      
      if (dist <= radius) {
        addToast({
          title: newMoment.title,
          description: `New ${newMoment.moment_type === 'event' ? 'event' : 'signal'} detected nearby.`,
          link: `/app/moment/${newMoment.id}`,
          type: 'signal'
        })
      }
    }
  }, [location, radius, addToast, setMoments])

  const handleRealtimeDelete = useCallback((id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
  }, [setMoments])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)
  
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('aura-rejected-ids')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    if (user) fetchFollowing()
  }, [user])

  const fetchFollowing = async () => {
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user!.id)
      
      setFollowingIds(new Set((data || []).map(f => f.following_id)))
    } catch (err) {
      console.error('Error fetching following:', err)
    }
  }

  useEffect(() => {
    if (!radiusOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-radius-dropdown]')) {
        setRadiusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [radiusOpen])

  const handleJoin = async (momentId: string) => {
    if (!user || joinedIds.has(momentId)) return
    setJoiningId(momentId)
    try {
      await joinMoment(momentId)
      setJoinedIds(prev => new Set([...prev, momentId]))
    } catch (err) {
      console.error(err)
    } finally {
      setJoiningId(null)
    }
  }

  const handleReject = (momentId: string) => {
    setRejectedIds(prev => {
      const next = new Set([...prev, momentId])
      sessionStorage.setItem('aura-rejected-ids', JSON.stringify([...next]))
      return next
    })
  }

  const filteredMoments = useMemo(() => {
    return moments.filter(m => {
      if (rejectedIds.has(m.id)) return false
      const expiresTime = new Date(m.expires_at).getTime()
      if (expiresTime < Date.now()) return false // hide expired
      
      if (activeTab === 'Moments') return m.moment_type === 'moment'
      if (activeTab === 'Events') return m.moment_type === 'event'
      if (activeTab === 'Following') return followingIds.has(m.creator_id)
      return true // 'All'
    })
  }, [moments, rejectedIds, activeTab, followingIds])

  const heroMoment = filteredMoments[0]
  const gridMoments = filteredMoments.slice(1)

  if (loading && moments.length === 0) {
    return (
      <div className="relative flex-1" style={{ height: '100vh', minHeight: '700px' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-void via-obsidian to-black animate-pulse" />
        <div className="absolute top-8 left-10 right-10">
          <div className="h-3 w-32 bg-white/5 rounded-full mb-4" />
          <div className="h-24 w-64 bg-white/5 rounded-xl" />
        </div>
        <div className="absolute bottom-10 left-10 right-10">
          <div className="h-4 w-48 bg-white/5 rounded-full mb-3" />
          <div className="h-16 w-3/4 bg-white/5 rounded-xl mb-6" />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-white/5 rounded-full" />
            <div className="h-10 w-32 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-void min-h-screen overflow-x-hidden">
      {/* 100SVH MAGAZINE HERO */}
      {heroMoment ? (
        <section className="relative h-[100svh] w-full overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src={`https://picsum.photos/seed/${heroMoment.id}/1920/1200`}
            className="absolute inset-0 h-full w-full object-cover"
            alt="Hero"
            onError={(e) => { 
              e.currentTarget.style.opacity = '0'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          
          {/* FLOATING PULSE TITLE - Adjusted for mobile overlap */}
          <div className="absolute inset-x-0 top-[15%] md:top-[20%] flex items-center justify-center pointer-events-none z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[35vw] md:text-[20vw] font-serif text-marble/5 tracking-tighter leading-none select-none"
            >
              Pulse
            </motion.h1>
          </div>

          {/* REFINED HEADER & FILTERS */}
          <div className="absolute top-0 left-0 right-0 z-30 flex flex-col pointer-events-none safe-area-pt">
            <div className="p-6 md:p-12 flex flex-col md:flex-row items-start md:items-end justify-between">
            <div className="pointer-events-auto">
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="micro-caps text-gold text-[10px] md:text-xs tracking-[0.4em] mb-2 md:mb-4"
              >
                ◈ Live Discovery · Spontaneous
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-6xl md:text-[120px] leading-none text-marble tracking-tighter opacity-90"
              >
                Pulse
              </motion.h1>
            </div>
            
            <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end gap-4 md:gap-6 pointer-events-auto">
              {/* Redesigned Filter Row 1 — Type tabs & Radius Dropdown */}
              <div className="flex items-center gap-2 mt-4 flex-wrap pointer-events-auto">
                {['All', 'Following', 'Moments', 'Events'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'micro-caps text-xs px-5 py-2 rounded-full whitespace-nowrap',
                      'transition-all duration-300',
                      activeTab === tab
                        ? 'bg-white text-black font-bold'
                        : 'bg-black/40 backdrop-blur-md border border-white/20 text-white/60'
                    )}
                  >
                    {tab}
                  </button>
                ))}

                {/* Radius dropdown trigger — right side */}
                <div className="relative ml-auto" data-radius-dropdown>
                  <button
                    onClick={() => setRadiusOpen(prev => !prev)}
                    className={cn(
                      'flex items-center gap-2 micro-caps text-xs px-4 py-2 rounded-full',
                      'transition-all duration-300 whitespace-nowrap',
                      'bg-black/40 backdrop-blur-md border text-white/60',
                      radiusOpen
                        ? 'border-gold/60 text-gold'
                        : 'border-white/20 hover:border-white/40'
                    )}
                  >
                    <span>
                      {radiusOptions.find(r => r.value === radius)?.label ?? '50 KM'}
                    </span>
                    <svg
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        radiusOpen ? 'rotate-180' : ''
                      )}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown panel */}
                  {radiusOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50
                      bg-black/90 backdrop-blur-2xl border border-white/12
                      rounded-2xl overflow-hidden shadow-2xl shadow-black/60
                      min-w-[140px]">
                      {radiusOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setRadius(opt.value)
                            setRadiusOpen(false)
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 micro-caps text-xs',
                            'transition-colors duration-200',
                            radius === opt.value
                              ? 'text-gold bg-gold/10'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {opt.value === radius && (
                            <span className="mr-2">✓</span>
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search shortcut */}
                <Link to="/app/search" className="shrink-0">
                  <div className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full',
                    'transition-all duration-300 cursor-pointer',
                    'bg-black/40 backdrop-blur-md border border-white/20',
                    'text-white/60 hover:text-white hover:border-white/40'
                  )}>
                    <Search className="w-4 h-4" />
                  </div>
                </Link>
              </div>

              {/* Redesigned Filter Row 2 — Live Count Badge */}
              <div className="flex items-center gap-2 mt-3 pointer-events-auto">
                <div className="flex items-center gap-2
                  bg-black/50 backdrop-blur-md border border-white/10
                  rounded-full px-3 py-1.5 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="micro-caps text-xs text-white/60">
                    {filteredMoments.length} signals · {radiusOptions.find(r => r.value === radius)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* HERO CONTENT FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 mb-6"
              >
                <span className="micro-caps text-xs px-4 py-1.5 bg-gold/10 border border-gold/30 text-gold rounded-full backdrop-blur-md">
                  Featured Signal
                </span>
                <span className="micro-caps text-xs px-4 py-1.5 bg-white/5 border border-white/10 text-white/50 rounded-full backdrop-blur-md">
                  Nearby
                </span>
              </motion.div>

              <Link to={`/app/moment/${heroMoment.id}`}>
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-serif text-4xl md:text-8xl text-white mb-6 leading-[0.9] tracking-tight hover:text-gold-pale transition-colors cursor-pointer"
                >
                  {heroMoment.title}
                </motion.h2>
              </Link>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(4, heroMoment.participant_count || 0))].map((_, i) => (
                      <img 
                        key={i} 
                        src={`https://i.pravatar.cc/100?u=${heroMoment.id}-${i}`}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-void" 
                        alt="p"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ))}
                  </div>
                  <span className="micro-caps text-[10px] text-marble/40">
                    {heroMoment.participant_count || 0} Attending
                  </span>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {!joinedIds.has(heroMoment.id) && (
                    <button
                      onClick={() => handleReject(heroMoment.id)}
                      className="flex-1 md:flex-none micro-caps text-[10px] md:text-sm px-6 py-3 md:py-4 rounded-full border border-white/20 text-white/60 
                        backdrop-blur-md hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleJoin(heroMoment.id)}
                    disabled={joinedIds.has(heroMoment.id) || joiningId === heroMoment.id}
                    className={cn(
                      "flex-[2] md:flex-none micro-caps text-[10px] md:text-sm px-8 py-3 md:py-4 rounded-full font-bold transition-all duration-300",
                      joinedIds.has(heroMoment.id)
                        ? "bg-gold/20 text-gold border border-gold/40 cursor-default"
                        : "bg-marble text-void hover:bg-green-400 hover:text-void hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]"
                    )}
                  >
                    {joiningId === heroMoment.id ? 'Processing...' : joinedIds.has(heroMoment.id) ? 'Joined' : 'Join Signal'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-void">
           <Radio className="w-16 h-16 text-marble/5 mb-8" />
           <h1 className="font-serif text-5xl text-marble/20 mb-4">Silence in the Void</h1>
           <p className="text-marble/20 max-w-sm mb-8">No signals detected in your immediate vicinity. Be the one to break the quiet.</p>
           <Link to="/app/create">
             <button className="micro-caps text-sm px-10 py-4 glass-panel hairline-all rounded-full text-marble/50 hover:text-marble transition-all">
               Initialize Signal
             </button>
           </Link>
        </div>
      )}

      {/* ── SIGNALS GRID ── */}
      <div className="px-4 lg:px-8 pb-24 pt-6">

        {filteredMoments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/4
              border border-white/8 flex items-center justify-center">
              <Compass className="w-6 h-6 text-marble/20" />
            </div>
            <p className="font-serif text-2xl text-marble/30">No signals nearby</p>
            <p className="text-sm text-marble/20 max-w-xs">
              Try expanding your radius or check back soon.
            </p>
            <Link to="/app/create">
              <button className="micro-caps text-sm px-6 py-3 rounded-full
                bg-white/5 border border-white/10 text-marble/50
                hover:text-marble hover:border-white/20 transition-all mt-2">
                Drop a Signal
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="max-w-7xl mx-auto">

            {/* Section label */}
            <div className="flex items-center justify-between mb-5">
              <p className="micro-caps text-xs text-marble/30">
                {filteredMoments.length} signal{filteredMoments.length !== 1 ? 's' : ''} nearby
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="micro-caps text-xs text-marble/30">live</p>
              </div>
            </div>

            {/* Magazine grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-auto">
              {filteredMoments.map((moment, i) => {
                const isEvent = moment.moment_type === 'event'
                const hoursLeft = Math.max(0, Math.round(
                  (new Date(moment.expires_at).getTime() - Date.now()) / 3600000
                ))
                const isUrgent = hoursLeft <= 3
                // Vary card heights for masonry feel
                const isTall = i % 5 === 0 || i % 5 === 3

                return (
                  <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl cursor-pointer',
                      'border border-white/8 hover:border-white/20',
                      'transition-all duration-500',
                      isTall ? 'row-span-1 sm:row-span-2' : 'row-span-1'
                    )}
                    style={{ minHeight: isTall ? '380px' : '220px' }}
                  >
                    <Link to={`/app/moment/${moment.id}`} className="block h-full">

                      {/* Background image */}
                      <img
                        src={`https://picsum.photos/seed/${moment.id}/600/500`}
                        className="absolute inset-0 w-full h-full object-cover
                          group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={e => { e.currentTarget.style.opacity = '0' }}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 transition-opacity duration-500"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)'
                        }}
                      />

                      {/* Hover overlay — subtle gold tint */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                        transition-opacity duration-500"
                        style={{ background: 'rgba(201,168,76,0.06)' }}
                      />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        <span className={cn(
                          'micro-caps text-xs px-2.5 py-1 rounded-full border backdrop-blur-md',
                          isEvent
                            ? 'bg-gold/20 border-gold/40 text-gold'
                            : 'bg-black/50 border-white/20 text-white/70'
                        )}>
                          {isEvent ? '◈ Event' : '⚡ Moment'}
                        </span>

                        {/* Urgency badge */}
                        {isUrgent && (
                          <span className="micro-caps text-xs px-2.5 py-1 rounded-full
                            bg-red-500/20 border border-red-500/40 text-red-400
                            backdrop-blur-md flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                            {hoursLeft}h left
                          </span>
                        )}
                      </div>

                      {/* Bottom content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">

                        {/* Tags */}
                        {moment.tags && moment.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {moment.tags.slice(0, 2).map(tag => (
                              <span key={tag}
                                className="micro-caps text-[10px] px-2 py-0.5 rounded-full
                                  bg-white/10 text-white/50 border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="font-serif text-white leading-tight mb-2
                          group-hover:text-gold-pale transition-colors duration-300"
                          style={{ fontSize: isTall ? '1.5rem' : '1.1rem' }}>
                          {moment.title}
                        </h3>

                        {/* Meta row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-white/40 text-xs">
                              <Users className="w-3 h-3" />
                              <span>{moment.capacity_limit}</span>
                            </div>
                            {!isUrgent && (
                              <div className="flex items-center gap-1 text-white/40 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{hoursLeft}h</span>
                              </div>
                            )}
                          </div>

                          {/* Join arrow — appears on hover */}
                          <div className="w-8 h-8 rounded-full bg-white/0
                            group-hover:bg-white/15 border border-white/0
                            group-hover:border-white/25
                            flex items-center justify-center
                            transition-all duration-300 -translate-x-2
                            group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>

                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-32" />
    </div>
  )
}
