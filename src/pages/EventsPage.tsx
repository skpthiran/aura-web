import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, Loader, Trophy, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyEvents } from '../hooks/useNearbyEvents'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'

interface EventCardProps {
  event: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void | Promise<void>
}

const EventCard: React.FC<EventCardProps> = ({ event, index, isJoined, isJoining, onJoin }) => {
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
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-8"
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

          {/* Join button */}
          <div className="shrink-0">
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
    </motion.div>
  )
}

export default function EventsPage() {
  usePageTitle('Colosseum')
  const { user } = useAuth()
  const { location } = useUserLocation()
  const [radius, setRadius] = useState<number>(50000) // default 50km
  
  const radiusOptions = [
    { label: '5 KM', value: 5000 },
    { label: '50 KM', value: 50000 },
    { label: 'Province', value: 150000 },
    { label: 'Country', value: 500000 },
    { label: 'Global', value: 99999999 },
  ]

  const { events, loading, refetch } = useNearbyEvents(location, radius)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())

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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 py-10">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="micro-caps text-gold mb-2">Structured Gatherings</p>
            <h1 className="font-serif text-4xl md:text-6xl text-marble tracking-tight">Colosseum</h1>
            <p className="micro-caps text-xs text-marble/30 mt-2">
              Curated Events · Planned Experiences
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 glass-panel rounded-full hairline-all
              flex items-center justify-center text-marble/40 
              hover:text-gold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          <span className="micro-caps text-[9px] text-white/20 shrink-0">Radius:</span>
          {radiusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRadius(opt.value)}
              className={cn(
                "micro-caps text-[9px] px-4 py-2 rounded-full border transition-all duration-300 whitespace-nowrap",
                radius === opt.value
                  ? "bg-gold/10 border-gold/40 text-gold"
                  : "border-white/5 text-white/30 hover:border-white/20"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="w-6 h-6 text-gold animate-spin" />
            <p className="micro-caps text-marble/30">
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
              py-24 gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full glass-panel hairline-all
              flex items-center justify-center">
              <Trophy className="w-8 h-8 text-marble/20" />
            </div>
            <div>
              <p className="font-serif text-3xl text-marble/30 mb-3">
                No events in your vicinity
              </p>
              <p className="text-sm text-marble/20 max-w-sm">
                The Colosseum awaits its first architect. 
                Establish an event to claim this space.
              </p>
            </div>
            <Link to="/app/create">
              <button className="micro-caps text-sm px-8 py-3 
                bg-gold/10 border border-gold/30 rounded-full 
                text-gold hover:bg-gold/20 transition-all cursor-pointer">
                Establish Event
              </button>
            </Link>
          </motion.div>
        )}

        {/* Events grid */}
        {!loading && events.length > 0 && (
          <div className="flex flex-col gap-4">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                isJoined={joinedIds.has(event.id)}
                isJoining={joiningId === event.id}
                onJoin={() => handleJoin(event.id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
