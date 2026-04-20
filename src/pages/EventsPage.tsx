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

interface EventCardProps {
  event: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void | Promise<void>
  onReject: () => void
}

const EventCard: React.FC<EventCardProps> = ({ event, index, isJoined, isJoining, onJoin, onReject }) => {
  const distanceDisplay = event.distance_meters
    ? event.distance_meters < 1000
      ? `${Math.round(event.distance_meters)}m away`
      : `${(event.distance_meters / 1000).toFixed(1)}km away`
    : 'Nearby'

  const expiresAt = new Date(event.expires_at)
  const hoursLeft = Math.max(0,
    Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  )

  const formattedDate = expiresAt.toLocaleDateString('en', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl group cursor-pointer"
    >
      <Link to={`/app/moment/${event.id}`}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={`https://picsum.photos/seed/${event.id}-event/1200/400`}
            className="w-full h-full object-cover transition-transform 
              duration-700 group-hover:scale-105"
            onError={(e) => { 
              e.currentTarget.style.opacity = '0'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r 
            from-void via-void/80 to-void/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 md:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-8"
          style={{ minHeight: '180px' }}>
          
          <div className="flex-1 md:max-w-lg">
            {/* Badge */}
            <div className="flex items-center gap-3 mb-3">
              <span className="micro-caps text-xs px-3 py-1 rounded-full
                bg-gold/10 border border-gold/30 text-gold">
                Event
              </span>
              <span className="micro-caps text-xs text-marble/40">
                {distanceDisplay}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl md:text-3xl text-marble mb-2 md:mb-3 
              group-hover:text-gold-pale transition-colors duration-300">
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-marble/50 mb-4 line-clamp-2 max-w-md">
                {event.description}
              </p>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
                {event.tags.map(tag => (
                  <span key={tag} className="text-[9px] md:text-xs micro-caps px-2 py-0.5
                    hairline-all rounded-full text-marble/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 md:gap-5">
              <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-marble/30">
                <Users className="w-3.5 h-3.5" />
                {event.participant_count ?? 0} / {event.capacity_limit}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-marble/30">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-marble/30">
                <Clock className="w-3.5 h-3.5" />
                {hoursLeft}h left
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-3">
            {!isJoined && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReject()
                }}
                className="p-3 rounded-full bg-white/5 border border-white/10 
                  text-white/40 hover:text-red-400 hover:border-red-500/50 
                  hover:bg-red-500/10 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onJoin()
              }}
              disabled={isJoined || isJoining}
              className={cn(
                'micro-caps text-xs md:text-sm px-6 md:px-8 py-3 rounded-full transition-all w-full md:w-auto text-center justify-center flex items-center',
                isJoined
                  ? 'bg-gold/10 text-gold border border-gold/30 cursor-default'
                  : 'bg-gold text-void hover:bg-gold-pale disabled:opacity-50 font-bold'
              )}
            >
              {isJoining ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : isJoined ? (
                'Attending'
              ) : (
                'Attend'
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* Joined Overlay — sibling of Link, scoped to relative motion.div */}
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

  const handleCardReject = (momentId: string) => {
    addRejectedId(momentId)
    setCardActions(prev => ({ ...prev, [momentId]: 'rejected' }))
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
  }, [user, events])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-void pb-[calc(64px+env(safe-area-inset-bottom))]">
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
        
        {/* Header Section — Fixed at top */}
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="micro-caps text-gold text-[10px] mb-1">Structured Gatherings</p>
              <h1 className="font-serif text-4xl text-marble tracking-tight uppercase">Colosseum</h1>
              <p className="micro-caps text-[9px] text-marble/30 mt-1">
                Curated Events · Planned Experiences
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="w-10 h-10 glass-panel rounded-sm hairline-all
                flex items-center justify-center text-marble/40 
                hover:text-gold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Radius Filter Dropdown */}
          <div className="relative" data-radius-dropdown>
            <button
              onClick={() => setRadiusOpen(o => !o)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm
                bg-white/5 border border-white/10 text-marble/60
                micro-caps text-[10px] transition-all hover:border-white/20 active:scale-95"
            >
              <Radar className="w-3 h-3 text-gold/60" />
              {radius >= 500 ? 'GLOBAL DISCOVERY' : `${radius} KM RANGE`}
              <svg className={cn('w-3 h-3 transition-transform duration-200 ml-1', radiusOpen && 'rotate-180')}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <AnimatePresence>
              {radiusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 z-50 bg-black/90 backdrop-blur-xl border
                    border-white/10 rounded-sm overflow-hidden shadow-2xl min-w-[160px]"
                >
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => { setRadius(r); setRadiusOpen(false) }}
                      className={cn(
                        'w-full px-5 py-3 text-left text-[10px] micro-caps transition-colors',
                        radius === r
                          ? 'text-gold bg-gold/10'
                          : 'text-marble/40 hover:text-marble hover:bg-white/5'
                      )}
                    >
                      {r} KM
                    </button>
                  ))}
                  <button
                    onClick={() => { setRadius(999999); setRadiusOpen(false) }}
                    className={cn(
                      'w-full px-5 py-3 text-left text-[10px] micro-caps transition-colors border-t border-white/5',
                      radius >= 999999
                        ? 'text-gold bg-gold/10'
                        : 'text-marble/40 hover:text-marble hover:bg-white/5'
                    )}
                  >
                    Global
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 scrollbar-hide">
          
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader className="w-6 h-6 text-gold animate-spin" />
              <p className="micro-caps text-[10px] text-marble/30">
                Scanning for gatherings...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && events.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center 
                py-20 gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full glass-panel hairline-all
                flex items-center justify-center">
                <Trophy className="w-6 h-6 text-marble/10" />
              </div>
              <div>
                <p className="font-serif text-2xl text-marble/30 mb-2">
                  No events in your vicinity
                </p>
                <p className="text-[11px] text-marble/20 max-w-xs mx-auto leading-relaxed micro-caps">
                  The Colosseum awaits its first architect. 
                  Establish an event to claim this space.
                </p>
              </div>
              <Link to="/app/create">
                <button className="micro-caps text-[10px] px-8 py-3 
                  bg-gold/10 border border-gold/30 rounded-full 
                  text-gold hover:bg-gold/20 transition-all cursor-pointer">
                  Establish Event
                </button>
              </Link>
            </motion.div>
          )}

          {/* Events grid */}
          {!loading && events.length > 0 && (
            <div className="flex flex-col gap-4 pb-10">
              <div className="flex items-center justify-between mb-2">
                <p className="micro-caps text-[9px] text-marble/30 tracking-widest">{events.length} ACTIVE EVENTS</p>
              </div>
              <AnimatePresence mode="popLayout">
                {events
                  .filter(event => cardActions[event.id] !== 'rejected')
                  .map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    isJoined={joinedIds.has(event.id) || cardActions[event.id] === 'joined'}
                    isJoining={joiningId === event.id || cardJoining[event.id]}
                    onJoin={() => handleJoin(event.id)}
                    onReject={() => handleCardReject(event.id)}
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
