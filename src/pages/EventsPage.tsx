import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Users, Clock, Loader, RefreshCw, Radar, MapPin, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyEvents } from '../hooks/useNearbyEvents'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn, calculateDistance } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ToastProvider'
import { useRealtimeMoments } from '../hooks/useRealtimeMoments'
import JoinedOverlay from '../components/JoinedOverlay'
import { getRejectedIds } from '../lib/cardState'
import { supabase } from '../lib/supabase'

interface PremiumEventCardProps {
  event: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void
}

const PremiumEventCard: React.FC<PremiumEventCardProps> = ({ event, index, isJoined, isJoining, onJoin }) => {
  const navigate = useNavigate()
  const distanceLabel = event.distance_meters
    ? event.distance_meters < 1000
      ? `${Math.round(event.distance_meters)}M`
      : `${((event.distance_meters || 0) / 1000).toFixed(1)}KM`
    : 'NEARBY'

  const expiresAt = new Date(event.expires_at)
  const formattedDate = expiresAt.toLocaleDateString('en', { month: 'short', day: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl",
        index === 0 ? "lg:col-span-3" : "lg:col-span-1"
      )}
      style={{ minHeight: index === 0 ? 'clamp(320px, 45vh, 480px)' : '280px' }}
      onClick={() => navigate(`/app/event/${event.id}`)}
    >
      {/* BG IMAGE */}
      <div className="absolute inset-0">
        <img 
          src={event.image_url || `https://picsum.photos/seed/${event.id}/1200/800`} 
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
          alt="" 
        />
        {/* MULTI-LAYER OVERLAYS */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

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
      </div>

      {/* TOP LEFT BADGE */}
      <div className="absolute top-5 left-5">
        <div className="px-3 py-1.5 rounded-full bg-gold/90 backdrop-blur-md text-obsidian text-[10px] font-black tracking-[0.15em] uppercase shadow-lg">
          Gathering
        </div>
      </div>

      {/* BOTTOM CONTENT */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {event.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 rounded-md bg-white/5 backdrop-blur-md border border-white/10 text-white/50 text-[9px] tracking-widest uppercase">
              {tag}
            </span>
          ))}
        </div>

        {/* TITLE — Strong and clear */}
        <h2 className={cn(
          "font-bold tracking-[0.05em] uppercase text-white leading-tight mb-3 drop-shadow-2xl",
          index === 0 ? "text-[28px] lg:text-[38px] max-w-[80%]" : "text-[20px]"
        )}>
          {event.title}
        </h2>

        {/* META ROW */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-medium tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-gold-pale" />
              <span>{distanceLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-medium tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-gold-pale" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            disabled={isJoining || isJoined}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-300",
              isJoined 
                ? "bg-gold/10 border border-gold/30 text-gold"
                : "bg-gold text-obsidian hover:bg-gold/90 active:scale-95 shadow-xl shadow-gold/10"
            )}
          >
            {isJoining ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : isJoined ? (
              "Joined"
            ) : (
              "Attend"
            )}
          </button>
        </div>
      </div>

      {/* JOINED OVERLAY — Full card blur */}
      <AnimatePresence>
        {isJoined && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 backdrop-blur-xl bg-black/40 flex items-center justify-center p-8 text-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                  <Users className="w-6 h-6 text-obsidian" />
                </div>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] font-black uppercase text-gold mb-1">Confirmed</p>
                <h3 className="text-white text-lg font-bold tracking-tight uppercase leading-tight">{event.title}</h3>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function EventsPage() {
  usePageTitle('Colosseum')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { location } = useUserLocation()
  const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 500]
  const [radius, setRadius] = useState<number>(50)
  const [radiusOpen, setRadiusOpen] = useState(false)

  const { events, loading, refetch, setEvents } = useNearbyEvents(location, radius * 1000)
  const { addToast } = useToast()

  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    if (newMoment.moment_type !== 'event') return
    setEvents?.(prev => {
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
      if (dist <= radius * 1000) {
        addToast({
          title: newMoment.title,
          description: "New structured gathering initialized nearby.",
          link: `/app/moment/${newMoment.id}`,
          type: 'signal'
        })
      }
    }
  }, [location, radius, addToast, setEvents])

  const handleRealtimeDelete = useCallback((id: string) => {
    setEvents?.(prev => prev.filter(m => m.id !== id))
  }, [setEvents])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)

  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [cardJoining, setCardJoining] = useState<Record<string, boolean>>({})

  const handleJoin = async (momentId: string) => {
    if (!user || joinedIds.has(momentId) || joiningId) return
    setJoiningId(momentId)
    setCardJoining(prev => ({ ...prev, [momentId]: true }))
    
    try {
      await joinMoment(momentId)
      setJoinedIds(prev => new Set([...prev, momentId]))
    } catch (err: any) {
      console.error('Join failed:', err)
    } finally {
      setJoiningId(null)
      setCardJoining(prev => ({ ...prev, [momentId]: false }))
    }
  }

  useEffect(() => {
    if (!user || events.length === 0) return
    const ids = events.map(e => e.id)
    supabase
      .from('participants')
      .select('moment_id')
      .eq('user_id', user.id)
      .in('moment_id', ids)
      .eq('status', 'joined')
      .then(({ data, error }) => {
        if (error) return
        if (!data) return
        setJoinedIds(prev => {
          const next = new Set(prev)
          data.forEach((row: any) => next.add(row.moment_id))
          return next
        })
      })
  }, [user, events])

  return (
    <div className="flex flex-col h-screen bg-obsidian overflow-hidden">
      <div className="flex-1 flex flex-col w-full max-w-screen-2xl mx-auto overflow-hidden">
        {/* HEADER — High intensity consolidation */}
        <div className="flex-shrink-0 px-6 lg:px-12 pt-8 pb-6 border-b border-white/[0.03]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/60 mb-2 font-black">Structured Gatherings</p>
              <h1 className="text-[32px] lg:text-[42px] font-bold tracking-[0.05em] uppercase text-white leading-none">Colosseum</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* RADIUS DROPDOWN */}
              <div className="relative" data-radius-dropdown>
                <button
                  onClick={() => setRadiusOpen(o => !o)}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-[10px] font-black tracking-widest uppercase hover:bg-white/[0.06] transition-all"
                >
                  <Radar className="w-3.5 h-3.5 text-gold" />
                  {radius >= 500 ? 'Global' : `${radius} KM`}
                </button>
                
                <AnimatePresence>
                  {radiusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-3 right-0 z-[100] min-w-[180px] bg-obsidian/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                      {RADIUS_OPTIONS.map(r => (
                        <button
                          key={r}
                          onClick={() => { setRadius(r); setRadiusOpen(false); }}
                          className={cn(
                            "w-full px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase transition-colors border-b border-white/[0.03]",
                            radius === r ? "text-gold bg-gold/5" : "text-white/40 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {r} KM
                        </button>
                      ))}
                      <button
                        onClick={() => { setRadius(99999); setRadiusOpen(false); }}
                        className={cn(
                          "w-full px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase transition-colors",
                          radius >= 99999 ? "text-gold bg-gold/5" : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        Global
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => refetch()}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white hover:border-gold/30 transition-all active:scale-95 shadow-xl"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-gold")} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-6">
            <div className="px-2 py-0.5 rounded bg-gold/20 mr-1">
              <p className="text-[11px] font-black text-gold tracking-tighter">{events.length}</p>
            </div>
            <p className="text-[10px] tracking-[0.1em] text-white/30 uppercase font-medium">Active Signals Broadcasted</p>
          </div>
        </div>

        {/* LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-12 pt-8 pb-32 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-2 border-gold/10 rounded-full" />
                <div className="absolute inset-0 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gold opacity-50" />
              </div>
              <p className="text-[11px] tracking-[0.4em] font-black uppercase text-gold/40 animate-pulse">Syncing Streams...</p>
            </div>
          ) : events.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-white/5 bg-white/[0.01] p-16 text-center shadow-inner mt-4"
            >
              <div className="w-20 h-20 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <MapPin className="w-8 h-8 text-white/10" />
              </div>
              <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase mb-10 font-bold">No structured signals detected</p>
              <Link to="/app/create">
                <button className="px-10 py-4 rounded-full bg-gold text-obsidian text-[11px] font-black tracking-widest uppercase hover:scale-105 transition-all shadow-xl shadow-gold/20">
                  Initialize Gathering
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-min">
              <AnimatePresence mode="popLayout">
                {events.map((event, i) => (
                  <PremiumEventCard 
                    key={event.id}
                    event={event}
                    index={i}
                    isJoined={joinedIds.has(event.id)}
                    isJoining={cardJoining[event.id]}
                    onJoin={() => handleJoin(event.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
