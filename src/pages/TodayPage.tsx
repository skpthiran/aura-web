import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Users, Loader, MapPin, Zap, Search, ArrowRight, Clock, Compass, Check, X, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { getSignalImage } from '../lib/signalImage'
import { useToast } from '../components/ToastProvider'
import { useRealtimeMoments } from '../hooks/useRealtimeMoments'
import { calculateDistance } from '../lib/utils'
import { SignalCardSkeleton, SkeletonBlock } from '../components/Skeleton'
import JoinedOverlay from '../components/JoinedOverlay'
import { getRejectedIds, addRejectedId } from '../lib/cardState'
import { useNavigate } from 'react-router-dom'
import { RADIUS_OPTIONS, DEFAULT_RADIUS } from '../lib/radius'

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

        {/* Joined Overlay */}
        {isJoined && (
          <JoinedOverlay />
        )}

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
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useUserLocation()
  const [activeTab, setActiveTab] = useState<'all' | 'moments' | 'events'>('all')
  
  const [selectedRadius, setSelectedRadius] = useState<number>(DEFAULT_RADIUS)
  const [showRadiusDropdown, setShowRadiusDropdown] = useState(false)
  const radiusBtnRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const handleRadiusOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (radiusBtnRef.current) {
      const rect = radiusBtnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 8, left: rect.left })
    }
    setShowRadiusDropdown(o => !o)
  }
  
  const { moments, loading, setMoments } = useNearbyMoments(selectedRadius)
  const { addToast } = useToast()

  // Realtime Integration
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    setMoments(prev => {
      const idx = prev.findIndex(m => m.id === newMoment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newMoment
        return next
      }
      return [newMoment, ...prev]
    })

    if (location && newMoment.lat !== undefined && newMoment.lng !== undefined) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        newMoment.lat,
        newMoment.lng
      )
      
      if (selectedRadius === 0 || dist <= selectedRadius * 1000) { 
        addToast({
          title: newMoment.title,
          description: `New ${newMoment.moment_type === 'event' ? 'event' : 'signal'} detected nearby.`,
          link: `/app/moment/${newMoment.id}`,
          type: 'signal'
        })
      }
    }
  }, [location, selectedRadius, addToast, setMoments])

  const handleRealtimeDelete = useCallback((id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
  }, [setMoments])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)
  
  const [cardActions, setCardActions] = useState<Record<string, 'joined' | 'rejected' | null>>(() => {
    const rejected = getRejectedIds()
    const initial: Record<string, 'joined' | 'rejected' | null> = {}
    rejected.forEach(id => { initial[id] = 'rejected' })
    return initial
  })
  
  const joinedIds = useMemo(() => 
    Object.keys(cardActions).filter(id => cardActions[id] === 'joined'), [cardActions]
  )
  const rejectedIds = useMemo(() => 
    Object.keys(cardActions).filter(id => cardActions[id] === 'rejected'), [cardActions]
  )

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (radiusBtnRef.current && !radiusBtnRef.current.contains(e.target as Node)) {
        setShowRadiusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleJoin = async (momentId: string) => {
    if (!user || cardActions[momentId] === 'joined') return
    try {
      await joinMoment(momentId)
      setCardActions(prev => ({ ...prev, [momentId]: 'joined' }))
    } catch (err: any) {
      console.error('Join failed:', err)
    }
  }

  const handleLeave = async (momentId: string) => {
    if (!user) return
    try {
      await leaveMoment(momentId)
      setCardActions(prev => ({ ...prev, [momentId]: null }))
    } catch (err: any) {
      console.error('Leave failed:', err)
    }
  }

  const handleReject = (momentId: string) => {
    addRejectedId(momentId)
    setCardActions(prev => ({ ...prev, [momentId]: 'rejected' }))
  }

  // ── SWIPE LOGIC ──
  const swipeState = useRef<{ startX: number; startY: number; el: HTMLDivElement | null }>({ startX: 0, startY: 0, el: null });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    swipeState.current.startX = e.touches[0].clientX;
    swipeState.current.startY = e.touches[0].clientY;
    swipeState.current.el = e.currentTarget;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>, momentId: string) => {
    const el = e.currentTarget;
    const dx = e.touches[0].clientX - swipeState.current.startX;
    const dy = e.touches[0].clientY - swipeState.current.startY;
    
    // Only horizontal swipe
    if (Math.abs(dy) > Math.abs(dx)) return;
    
    const capped = Math.max(-120, Math.min(120, dx));
    const rotate = capped * 0.08;
    el.style.transform = `translateX(${capped}px) rotate(${rotate}deg)`;
    el.style.transition = 'none';
    
    // Show join indicator
    const joinIndicator = el.querySelector('[data-join-indicator]') as HTMLElement;
    const rejectIndicator = el.querySelector('[data-reject-indicator]') as HTMLElement;
    
    if (joinIndicator && rejectIndicator) {
      if (dx > 20) {
        joinIndicator.style.opacity = Math.min(1, (dx - 20) / 60).toString();
        rejectIndicator.style.opacity = '0';
      } else if (dx < -20) {
        rejectIndicator.style.opacity = Math.min(1, (-dx - 20) / 60).toString();
        joinIndicator.style.opacity = '0';
      } else {
        joinIndicator.style.opacity = '0';
        rejectIndicator.style.opacity = '0';
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, momentId: string) => {
    const el = e.currentTarget;
    const dx = e.changedTouches[0].clientX - swipeState.current.startX;
    
    el.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    const joinIndicator = el.querySelector('[data-join-indicator]') as HTMLElement;
    const rejectIndicator = el.querySelector('[data-reject-indicator]') as HTMLElement;
    
    if (dx > 80) {
      // SWIPE RIGHT — JOIN
      el.style.transform = 'translateX(120%) rotate(15deg)';
      el.style.opacity = '0';
      setTimeout(() => handleJoin(momentId), 350);
    } else if (dx < -80) {
      // SWIPE LEFT — REJECT
      el.style.transform = 'translateX(-120%) rotate(-15deg)';
      el.style.opacity = '0';
      setTimeout(() => handleReject(momentId), 350);
    } else {
      // SNAP BACK
      el.style.transform = 'translateX(0) rotate(0deg)';
      if (joinIndicator) joinIndicator.style.opacity = '0';
      if (rejectIndicator) rejectIndicator.style.opacity = '0';
    }
  };

  const filteredMoments = useMemo(() => {
    return moments.filter(m => {
      if (cardActions[m.id] === 'rejected') return false
      const expiresTime = new Date(m.expires_at).getTime()
      if (expiresTime < Date.now()) return false 
      
      if (activeTab === 'moments') return m.moment_type === 'moment'
      if (activeTab === 'events') return m.moment_type === 'event'
      return true
    })
  }, [moments, cardActions, activeTab])

  useEffect(() => {
    if (!user || moments.length === 0) return
    const ids = moments.map(m => m.id)
    supabase
      .from('participants')
      .select('moment_id')
      .eq('user_id', user.id)
      .in('moment_id', ids)
      .then(({ data, error }) => {
        if (error) { console.error('joined state error:', error); return }
        if (!data) return
        setCardActions(prev => {
          const next = { ...prev }
          data.forEach((row: any) => {
            if (next[row.moment_id] !== 'rejected') {
              next[row.moment_id] = 'joined'
            }
          })
          return next
        })
      })
  }, [user, moments])

  const heroMoment = filteredMoments[0]
  const nearbyMoments = filteredMoments.slice(1)

  if (loading && moments.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin" />
        <p className="mt-4 text-[#c9a84c]/50 text-[10px] tracking-[0.2em] uppercase">Scanning Frequencies...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col overflow-x-hidden">

      {/* ══════════════════════════════════════
          HERO — Featured Signal
      ══════════════════════════════════════ */}
      {heroMoment && (
        <div className="relative w-full overflow-hidden flex-shrink-0 h-[45vh] lg:h-[60vh] min-h-[400px] lg:min-h-[580px]">

          {/* Background image */}
          <img
            src={heroMoment.image_url || getSignalImage(heroMoment.id, heroMoment.tags, heroMoment.moment_type)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
            onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${heroMoment.id}/1600/900`; }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080f]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080f]/30 via-transparent to-transparent" />

          {/* Top bar (Radius selector moved to hero for mobile) */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6 z-10">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-[#c9a84c]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                <span className="text-[9px] font-black tracking-[0.22em] uppercase text-[#c9a84c]">Featured</span>
              </div>
            </div>

            {/* Radius selector */}
            <div className="relative">
              <button
                ref={radiusBtnRef}
                onClick={handleRadiusOpen}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white/50 text-[9px] tracking-[0.18em] uppercase hover:border-white/20 transition-all"
              >
                {RADIUS_OPTIONS.find(o => o.value === selectedRadius)?.label || `${selectedRadius} KM`}
                {showRadiusDropdown
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
              </button>
            </div>
          </div>

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 lg:pb-16 z-10">
            <div className="max-w-7xl mx-auto">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {heroMoment.tags?.slice(0, 3).map(tag => (
                  <span key={tag}
                    className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 text-[9px] tracking-[0.15em] uppercase">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-white font-black uppercase leading-[0.92] mb-6 drop-shadow-2xl"
                style={{ fontSize: 'clamp(32px, 8vw, 84px)', letterSpacing: '0.03em' }}>
                {heroMoment.title}
              </h1>

              {/* Action row - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                
                {/* Attendees stack (desktop/tablet only) */}
                <div className="hidden sm:flex items-center gap-3 mr-4">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(heroMoment.participant_count ?? 1, 3))].map((_, i) => (
                      <div key={i}
                        className="w-8 h-8 rounded-full border-2 border-[#08080f] bg-gradient-to-br from-[#c9a84c]/40 to-[#c9a84c]/10 flex items-center justify-center text-[10px] font-bold text-[#c9a84c]">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/40 text-[10px] tracking-[0.15em] uppercase whitespace-nowrap">
                    {heroMoment.participant_count ?? 0} inside
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  {joinedIds.includes(heroMoment.id) ? (
                    <button
                      onClick={() => handleLeave(heroMoment.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-[0.18em] uppercase transition-all">
                      <span>✓</span> Joined
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(heroMoment.id)}
                      className="flex-1 sm:flex-none px-8 py-3.5 rounded-full text-[#08080f] text-[10px] font-black tracking-[0.18em] uppercase transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-[#c9a84c]/20"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #dfc070)' }}>
                      Join Signal
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleReject(heroMoment.id)}
                    className="p-3.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-white/40 hover:border-red-500/30 hover:text-red-400/60 transition-all duration-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          NEARBY SIGNALS SECTION
      ══════════════════════════════════════ */}
      <div className="flex-1 px-5 pt-10 pb-32 max-w-7xl mx-auto w-full">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-px w-5 bg-[#c9a84c]/40" />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-white/30">
              {nearbyMoments.length} Signal{nearbyMoments.length !== 1 ? 's' : ''} Nearby
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] uppercase text-[#c9a84c]/50">Live</span>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="lg:hidden flex items-center justify-center gap-4 mb-8 py-2 border-b border-white/[0.03]">
          <div className="flex items-center gap-1.5 text-white/15 text-[9px] tracking-[0.15em] uppercase">
            <span>←</span>
            <span>Swipe to reject</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-1.5 text-white/15 text-[9px] tracking-[0.15em] uppercase">
            <span>Swipe to join</span>
            <span>→</span>
          </div>
        </div>

        {/* Signal cards grid */}
        {nearbyMoments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nearbyMoments.filter(m => !rejectedIds.includes(m.id)).map((moment) => {
              const cardImage = moment.image_url || getSignalImage(moment.id, moment.tags, moment.moment_type);
              const isJoined = joinedIds.includes(moment.id);
              return (
                <div
                  key={moment.id}
                  className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/60 select-none"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={(e) => handleTouchMove(e, moment.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, moment.id)}
                  onClick={() => navigate(`/app/moment/${moment.id}`)}
                >
                  {/* JOIN INDICATOR — shows on swipe right */}
                  <div
                    data-join-indicator
                    className="absolute inset-0 z-20 flex items-center justify-start pl-6 pointer-events-none rounded-3xl"
                    style={{ 
                      opacity: 0, 
                      background: 'linear-gradient(to right, rgba(201,168,76,0.35), transparent)',
                      transition: 'opacity 0.1s'
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-full border-2 border-[#c9a84c] bg-[#c9a84c]/20 flex items-center justify-center">
                        <span className="text-[#c9a84c] text-2xl">✓</span>
                      </div>
                      <span className="text-[#c9a84c] text-[10px] font-black tracking-[0.2em] uppercase">Join</span>
                    </div>
                  </div>

                  {/* REJECT INDICATOR — shows on swipe left */}
                  <div
                    data-reject-indicator
                    className="absolute inset-0 z-20 flex items-center justify-end pr-6 pointer-events-none rounded-3xl"
                    style={{ 
                      opacity: 0, 
                      background: 'linear-gradient(to left, rgba(239,68,68,0.25), transparent)',
                      transition: 'opacity 0.1s'
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-full border-2 border-red-400/60 bg-red-500/15 flex items-center justify-center">
                        <span className="text-red-400 text-2xl">✕</span>
                      </div>
                      <span className="text-red-400/80 text-[10px] font-black tracking-[0.2em] uppercase">Reject</span>
                    </div>
                  </div>
                  {/* Card image */}
                  <div className="relative h-[220px] overflow-hidden">
                    <img
                      src={cardImage}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${moment.id}/600/400`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/20 to-transparent" />

                    {/* Joined Lock Overlay */}
                    {isJoined && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-300 group-hover:backdrop-blur-[3px]"
                        style={{ background: 'rgba(8,8,15,0.5)' }}>
                        <div className="flex flex-col items-center gap-2 transition-transform duration-300 group-hover:scale-110">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center border border-[#c9a84c]/30 bg-[#c9a84c]/10 transition-all duration-300 group-hover:border-[#c9a84c]/60 group-hover:bg-[#c9a84c]/20 group-hover:shadow-lg group-hover:shadow-[#c9a84c]/20">
                            <Lock className="w-5 h-5 text-[#c9a84c]" strokeWidth={1.5} />
                          </div>
                          <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[#c9a84c]/80 group-hover:text-[#c9a84c] transition-colors duration-300">✓ Joined</span>
                        </div>
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/8">
                      <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                      <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[#c9a84c]/80">
                        {moment.moment_type || 'Moment'}
                      </span>
                    </div>

                    {/* Joined badge */}
                    {isJoined && (
                      <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30">
                        <span className="text-xs text-emerald-400">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-6" style={{ background: 'linear-gradient(180deg, #0d0d18 0%, #0a0a12 100%)' }}>

                    {/* Tags */}
                    {moment.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {moment.tags.slice(0, 2).map(tag => (
                          <span key={tag}
                            className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/30 text-[7px] tracking-[0.15em] uppercase">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-white font-black uppercase text-[15px] tracking-[0.04em] leading-tight mb-4 min-h-[2.5rem] line-clamp-2">
                      {moment.title}
                    </h3>

                    {/* Stats and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-white/25 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#c9a84c]/40" strokeWidth={1.5} />
                          <span>{moment.participant_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#c9a84c]/40" strokeWidth={1.5} />
                          <span>{moment.distance_meters ? `${(moment.distance_meters / 1000).toFixed(1)}KM` : 'Nearby'}</span>
                        </div>
                      </div>

                    {isJoined ? (
                      <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleLeave(moment.id)}
                          className="py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-white/30 text-[8px] font-bold tracking-[0.15em] uppercase hover:border-red-500/25 hover:text-red-400/50 hover:bg-red-500/5 transition-all">
                          Leave
                        </button>
                        <div className="py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 flex items-center justify-center gap-1.5">
                          <span className="text-emerald-400 text-[8px] font-black tracking-[0.15em] uppercase">✓ Joined</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleReject(moment.id)}
                          className="py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-white/30 text-[8px] font-bold tracking-[0.15em] uppercase hover:border-red-500/20 hover:text-red-400/50 transition-all">
                          Reject
                        </button>
                        <button
                          onClick={() => handleJoin(moment.id)}
                          className="py-2.5 rounded-xl text-[#08080f] text-[8px] font-black tracking-[0.15em] uppercase transition-all hover:opacity-90 active:scale-[0.97]"
                          style={{ background: 'linear-gradient(135deg, #c9a84c, #dfc070)' }}>
                          Join
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.025] border border-white/5 flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-white/10" strokeWidth={1.5} />
            </div>
            <p className="text-white/30 text-[12px] font-bold tracking-[0.25em] uppercase mb-2">No Signals Nearby</p>
            <p className="text-white/10 text-[11px] leading-relaxed max-w-[220px]">Try expanding your search radius to find deeper frequencies.</p>
          </div>
        )}
      </div>

      {/* Radius dropdown portal */}
      {showRadiusDropdown && createPortal(
        <div
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="w-40 rounded-2xl border border-white/10 bg-[#0f0f1a]/95 backdrop-blur-2xl shadow-2xl overflow-hidden py-1"
        >
          {RADIUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSelectedRadius(opt.value); setShowRadiusDropdown(false); }}
              className="w-full px-5 py-3 text-left text-[10px] tracking-[0.15em] uppercase hover:bg-white/5 transition-all outline-none"
              style={{ color: selectedRadius === opt.value ? '#c9a84c' : 'rgba(255,255,255,0.4)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
