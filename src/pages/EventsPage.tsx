import React,{ useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, Loader, Trophy, RefreshCw, X, Lock, Radar } from 'lucide-react'
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
import { getRejectedIds, addRejectedId } from '../lib/cardState'
import { supabase } from '../lib/supabase'

interface PremiumEventCardProps {
  event: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void
}

const PremiumEventCard: React.FC<PremiumEventCardProps> = ({ event, index, isJoined, isJoining, onJoin }) => {
  const distanceLabel = event.distance_meters
    ? event.distance_meters < 1000
      ? `${Math.round(event.distance_meters)}M`
      : `${(event.distance_meters / 1000).toFixed(1)}KM`
    : 'NEARBY'

  const expiresAt = new Date(event.expires_at)
  const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))
  const formattedDate = expiresAt.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const isExpiringSoon = hoursLeft < 4
  const timeLeft = hoursLeft === 0 ? 'Expiring' : `${hoursLeft}H LEFT`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative w-full rounded-[28px] overflow-hidden cursor-pointer group shadow-2xl glass-panel hairline-all"
      style={{ minHeight: 'clamp(200px, 28vh, 320px)' }}
    >
      <Link to={`/app/moment/${event.id}`}>
        {/* Background image or gradient */}
        <div className="absolute inset-0">
          <img 
            src={`https://picsum.photos/seed/${event.id}/1200/600`}
            className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-75 transition-all duration-1000"
            alt=""
          />
          {/* Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080f]/20 via-transparent to-transparent" />
        </div>
        
        {/* TOP badges */}
        <div className="absolute top-5 left-5 flex gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c] text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
            Event
          </span>
          <span className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-white/50 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
            {distanceLabel}
          </span>
        </div>

        {/* BOTTOM content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-4">
            <h2 className="text-white text-2xl font-serif tracking-widest uppercase mb-2 drop-shadow-2xl leading-tight">
              {event.title}
            </h2>
            <p className="text-white/40 text-xs line-clamp-1 italic tracking-wide max-w-sm">
              {event.description || "No description provided."}
            </p>
          </div>
          
          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/30 text-[9px] font-bold tracking-widest uppercase">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta row + Attend button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-5 text-[10px] text-white/40 tracking-widest font-medium">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 opacity-30 text-[#c9a84c]" />
                {event.participant_count ?? 0} / {event.capacity_limit}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 opacity-30 text-[#c9a84c]" />
                {formattedDate}
              </span>
              <span className={cn('flex items-center gap-2', isExpiringSoon ? 'text-red-400 font-bold' : 'text-white/30')}>
                <Clock className="w-3.5 h-3.5 opacity-30 text-[#c9a84c]" />
                {timeLeft}
              </span>
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onJoin();
              }}
              disabled={isJoined || isJoining}
              className={cn(
                "px-8 py-3 rounded-full text-[11px] font-black tracking-[0.2em] uppercase transition-all active:scale-90",
                isJoined 
                  ? "bg-white/5 border border-white/10 text-white/20"
                  : "bg-[#c9a84c] text-[#08080f] shadow-[0_0_30px_rgba(201,168,76,0.3)] hover:shadow-[0_0_40px_rgba(201,168,76,0.5)]"
              )}
            >
              {isJoining ? <Loader className="w-3.5 h-3.5 animate-spin" /> : isJoined ? 'Attending' : 'Attend'}
            </button>
          </div>
        </div>
      </Link>
      
      {/* Joined Overlay */}
      {isJoined && (
        <JoinedOverlay title={event.title} />
      )}
    </motion.div>
  )
}

export default function EventsPage() {
  usePageTitle('Colosseum')
  const { user } = useAuth()
  const { location } = useUserLocation()
  const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 500]
  const [radius, setRadius] = useState<number>(50) // default 50km
  const [radiusOpen, setRadiusOpen] = useState(false)

  const { events, loading, refetch, setEvents } = useNearbyEvents(location, radius * 1000)
  const { addToast } = useToast()

  // Realtime Integration
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    if (newMoment.moment_type !== 'event') return

    // Sync state
    setEvents?.(prev => {
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
      
      if (dist <= radius * 1000) {
        addToast({
          title: newMoment.title,
          description: "A new structured gathering has been initialized nearby.",
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
  const [cardActions, setCardActions] = useState<Record<string, 'joined' | 'rejected' | null>>(() => {
    const rejected = getRejectedIds()
    const initial: Record<string, 'joined' | 'rejected' | null> = {}
    rejected.forEach(id => { initial[id] = 'rejected' })
    return initial
  })
  const [cardJoining, setCardJoining] = useState<Record<string, boolean>>({})

  const handleJoin = async (momentId: string) => {
    if (!user || joinedIds.has(momentId) || cardActions[momentId] === 'joined') return
    setJoiningId(momentId)
    setCardJoining(prev => ({ ...prev, [momentId]: true }))
    
    try {
      await joinMoment(momentId)
      setJoinedIds(prev => new Set([...prev, momentId]))
      setCardActions(prev => ({ ...prev, [momentId]: 'joined' }))
    } catch (err: any) {
      console.error('Join failed:', err)
      alert(err.message ?? 'Failed to join signal')
    } finally {
      setJoiningId(null)
      setCardJoining(prev => ({ ...prev, [momentId]: false }))
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (radiusOpen && !target.closest('[data-radius-dropdown]')) {
        setRadiusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [radiusOpen])

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
        if (error) { console.error('joined state error:', error); return }
        if (!data) return
        setJoinedIds(prev => {
          const next = new Set(prev)
          data.forEach((row: any) => next.add(row.moment_id))
          return next
        })
      })
  }, [user, events])

  return (
    <div className="flex flex-col h-screen bg-[#08080f] overflow-hidden">
      <div className="flex-1 flex flex-col w-full max-w-screen-2xl mx-auto overflow-hidden">
        {/* HEADER — fixed, never scrolls */}
        <div className="flex-shrink-0 px-8 pt-8 pb-4 lg:px-10 lg:pt-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] tracking-[0.3em] font-mono font-bold uppercase text-[#c9a84c]/60 mb-2">
              Structured Gatherings
            </p>
            <h1 className="text-4xl lg:text-5xl font-serif tracking-[0.05em] uppercase text-white mb-2 shadow-sm">
              Colosseum
            </h1>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.8)]" />
               <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium">
                 {events.length} Active Projections
               </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="w-11 h-11 rounded-full border border-white/5 bg-white/[0.02] 
              flex items-center justify-center text-white/20 
              hover:text-[#c9a84c] hover:border-[#c9a84c]/20 transition-all cursor-pointer active:scale-95 shadow-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-4 mt-8">
           {/* Radius Filter Dropdown */}
           <div className="relative" data-radius-dropdown>
            <button
              onClick={() => setRadiusOpen(o => !o)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full
                bg-white/[0.02] border border-white/10 text-white/50
                text-[10px] font-bold tracking-[0.15em] uppercase transition-all active:scale-95 hover:border-white/20"
            >
              <Radar className="w-3.5 h-3.5 text-[#c9a84c]" />
              {radius >= 500 ? 'Global' : `${radius} KM`}
              <svg className={cn('w-3.5 h-3.5 transition-transform duration-300', radiusOpen && 'rotate-180')}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <AnimatePresence>
              {radiusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute top-full mt-3 left-0 z-[100] bg-[#0a0a14]/95 backdrop-blur-2xl border
                    border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] min-w-[160px]"
                >
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => { setRadius(r); setRadiusOpen(false) }}
                      className={cn(
                        'w-full px-6 py-4 text-left text-[10px] font-bold tracking-widest uppercase transition-colors',
                        radius === r
                          ? 'text-[#c9a84c] bg-[#c9a84c]/10'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {r} KM
                    </button>
                  ))}
                  <div className="h-px bg-white/5 mx-2" />
                  <button
                    onClick={() => { setRadius(999999); setRadiusOpen(false) }}
                    className={cn(
                      'w-full px-6 py-4 text-left text-[10px] font-bold tracking-widest uppercase transition-colors',
                      radius >= 999999
                        ? 'text-[#c9a84c] bg-[#c9a84c]/10'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    )}
                  >
                    Global Range
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

        {/* EVENTS LIST — scrollable, fills remaining height */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 lg:px-10 scrollbar-hide pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative w-12 h-12">
              <Loader className="w-12 h-12 text-[#c9a84c] animate-spin absolute inset-0 opacity-20" />
              <div className="w-12 h-12 border-2 border-[#c9a84c] rounded-full border-t-transparent animate-[spin_1.5s_linear_infinite]" />
            </div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 animate-pulse">Syncing Colosseum...</p>
          </div>
        ) : events.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[32px] border border-white/5 bg-white/[0.01] p-12 text-center py-24 shadow-inner"
          >
            <div className="w-16 h-16 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Calendar className="w-6 h-6 text-white/10" />
            </div>
            <p className="text-white/20 text-xs tracking-[0.3em] uppercase mb-10">Historical silence observed</p>
            <Link to="/app/create">
              <button className="text-[11px] font-black tracking-[0.25em] uppercase px-12 py-4 rounded-full bg-marble text-void hover:bg-[#c9a84c] transition-all shadow-xl active:scale-95">
                Establish Signal
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {events
                .filter(event => cardActions[event.id] !== 'rejected')
                .map((event, i) => (
                  <PremiumEventCard 
                    key={event.id}
                    event={event}
                    index={i}
                    isJoined={joinedIds.has(event.id) || cardActions[event.id] === 'joined'}
                    isJoining={joiningId === event.id || cardJoining[event.id]}
                    onJoin={() => handleJoin(event.id)}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

        {/* Safe Area Spacer for Nav Integration */}
        <div className="flex-shrink-0 h-[calc(64px+env(safe-area-inset-bottom))]" />
      </div>
    </div>
  )
}
