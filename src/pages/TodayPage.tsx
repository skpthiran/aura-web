import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { MapPin, Loader, RefreshCw, Radio, Users, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'

interface MomentCardProps {
  moment: Moment
  index: number
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void | Promise<void>
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, index, isJoined, isJoining, onJoin }) => {
  const isEvent = moment.moment_type === 'event'
  
  // Format distance
  const distanceDisplay = moment.distance_meters 
    ? moment.distance_meters < 1000
      ? `${Math.round(moment.distance_meters)}m`
      : `${(moment.distance_meters / 1000).toFixed(1)}km`
    : 'nearby'

  // Format time remaining
  const expiresAt = new Date(moment.expires_at)
  const hoursLeft = Math.max(0, 
    Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  )
  const timeDisplay = hoursLeft === 0 ? 'Expiring soon' : `${hoursLeft}h left`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={cn(
        'glass-panel rounded-2xl p-5 border transition-colors',
        isEvent ? 'border-gold/20 hover:border-gold/40' 
                : 'border-crimson/20 hover:border-crimson/40'
      )}
    >
      {/* Top row: type badge + distance */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          'micro-caps text-xs px-2 py-1 rounded-full border',
          isEvent 
            ? 'text-gold border-gold/30 bg-gold/5' 
            : 'text-crimson-bright border-crimson/30 bg-crimson/5'
        )}>
          {isEvent ? 'Event' : 'Moment'}
        </span>
        <span className="text-xs text-marble/30 micro-caps">{distanceDisplay}</span>
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl text-marble mb-1">{moment.title}</h3>
      
      {/* Description */}
      {moment.description && (
        <p className="text-sm text-marble/50 mb-4 line-clamp-2">
          {moment.description}
        </p>
      )}

      {/* Tags */}
      {moment.tags && moment.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {moment.tags.map(tag => (
            <span key={tag} className="text-xs micro-caps px-2 py-0.5 
              hairline-all rounded-full text-marble/40">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: participants + time + join button */}
      <div className="flex items-center justify-between pt-3 hairline-t">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-marble/40">
            <Users className="w-3.5 h-3.5" />
            {moment.participant_count ?? 0} / {moment.capacity_limit}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-marble/30">
            <Clock className="w-3.5 h-3.5" />
            {timeDisplay}
          </span>
        </div>
        
        <button
          onClick={onJoin}
          disabled={isJoined || isJoining}
          className={cn(
            'micro-caps text-xs px-4 py-2 rounded-full transition-all',
            isJoined
              ? 'bg-gold/10 text-gold border border-gold/30 cursor-default'
              : 'bg-marble text-void hover:bg-gold-pale disabled:opacity-50'
          )}
        >
          {isJoining ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : isJoined ? (
            'Joined'
          ) : (
            'Join Signal'
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default function TodayPage() {
  const { location } = useUserLocation()
  const { moments, loading, error, refetch } = useNearbyMoments(location)
  const { user } = useAuth()
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
      <div className="max-w-2xl mx-auto p-6 py-10">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="micro-caps text-gold mb-2">Live Signals</p>
            <h1 className="font-serif text-4xl text-marble">Today</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-marble/30 micro-caps">
              {moments.length} active
            </span>
            <button 
              onClick={refetch}
              className="w-8 h-8 glass-panel rounded-full flex items-center 
                justify-center text-marble/40 hover:text-gold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Location warning banner */}
        {!location && !loading && (
          <div className="mb-6 px-4 py-3 bg-crimson/10 border border-crimson/20 
            rounded-xl flex items-center gap-3">
            <MapPin className="w-4 h-4 text-crimson-bright shrink-0" />
            <p className="text-sm text-crimson-bright">
              Enable location to see signals near you
            </p>
          </div>
        )}



        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border border-gold/20 
              flex items-center justify-center">
              <Loader className="w-5 h-5 text-gold animate-spin" />
            </div>
            <p className="micro-caps text-marble/30">Scanning vicinity...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && moments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6 
              text-center"
          >
            <div className="w-16 h-16 rounded-full glass-panel flex items-center 
              justify-center">
              <Radio className="w-6 h-6 text-marble/20" />
            </div>
            <div>
              <p className="font-serif text-2xl text-marble/40 mb-2">
                No signals detected
              </p>
              <p className="text-sm text-marble/20 max-w-xs">
                The vicinity is quiet. Be the first to broadcast a signal.
              </p>
            </div>
            <Link to="/app/create">
              <button className="micro-caps text-sm px-6 py-3 bg-marble/10 
                border border-white/10 rounded-full text-marble/60 
                hover:text-marble hover:border-white/20 transition-all">
                Create Signal
              </button>
            </Link>
          </motion.div>
        )}

        {/* Moment cards */}
        {!loading && moments.length > 0 && (
          <div className="flex flex-col gap-4">
            {moments.map((moment, i) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                index={i}
                isJoined={joinedIds.has(moment.id)}
                isJoining={joiningId === moment.id}
                onJoin={() => { handleJoin(moment.id) }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
