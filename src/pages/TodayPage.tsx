import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Loader, MapPin, Zap, Check, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'

interface MomentCardProps {
  moment: Moment
  index: number
  featured: boolean
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void
  onReject: () => void
}

const MomentCard: React.FC<MomentCardProps> = ({ 
  moment, 
  index,
  featured, 
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
    if (!moment.expires_at) return 'limited time'
    const now = new Date().getTime()
    const expires = new Date(moment.expires_at).getTime()
    const diff = expires - now
    
    if (diff <= 0) return 'expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) return `${Math.floor(hours / 24)}d left`
    if (hours > 0) return `${hours}h left`
    return `${minutes}m left`
  }, [moment.expires_at])

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ minHeight: '70vh' }}
        className="relative overflow-hidden rounded-3xl group cursor-pointer
          border border-white/5 hover:border-white/15 transition-all duration-700
          mb-4"
      >
        <img
          src={`https://picsum.photos/seed/${moment.id}/1920/1080`}
          className="absolute inset-0 w-full h-full object-cover 
            scale-105 group-hover:scale-110 transition-transform duration-[3s]"
          alt={moment.title}
        />
        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t 
          from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r 
          from-black/70 via-transparent to-transparent" />
        
        {/* Top left badges */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
          <span className={cn(
            "micro-caps text-xs px-4 py-2 rounded-full border backdrop-blur-md",
            isEvent
              ? "bg-gold/15 border-gold/50 text-gold"
              : "bg-crimson/15 border-crimson/50 text-crimson-bright"
          )}>
            {isEvent ? '◈ Event' : '⚡ Moment'}
          </span>
          <span className="micro-caps text-xs text-white/50 
            bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {distanceDisplay}
          </span>
        </div>
        
        {/* Live indicator */}
        <div className="absolute top-8 right-8 z-20 flex items-center gap-2
          bg-black/30 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="micro-caps text-xs text-white/50">Live</span>
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-10 z-20">
          {/* Tags row */}
          {moment.tags && moment.tags.length > 0 && (
            <div className="flex gap-2 mb-5">
              {moment.tags.slice(0, 4).map(tag => (
                <span key={tag} className="micro-caps text-xs px-3 py-1 
                  rounded-full border border-white/15 text-white/40 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Title - massive */}
          <h2 className="font-serif text-6xl md:text-7xl text-white mb-3 
            leading-tight max-w-3xl
            group-hover:text-gold-pale transition-colors duration-500">
            {moment.title}
          </h2>
          
          {moment.description && (
            <p className="text-white/50 text-base mb-8 max-w-2xl line-clamp-2">
              {(moment.description as string)}
            </p>
          )}
          
          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Participant avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[...Array(Math.min(5, Math.max(0, moment.participant_count ?? 0)))].map((_, i) => (
                    <img key={i} 
                      src={`https://i.pravatar.cc/36?img=${(parseInt(moment.id.slice(-2), 16) || 0) + i + 10}`}
                      className="w-9 h-9 rounded-full border-2 border-black object-cover"
                      alt="user"
                    />
                  ))}
                </div>
                <span className="text-white/40 text-sm micro-caps">
                  {moment.participant_count ?? 0} / {moment.capacity_limit} joined
                </span>
              </div>
              <span className="text-white/30 text-sm micro-caps">
                {timeDisplay}
              </span>
            </div>
            
            {/* Buttons */}
            <div className="flex items-center gap-3">
              {!isJoined && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(); }}
                  className="micro-caps text-sm px-6 py-3 rounded-full 
                    border border-white/20 text-white/50 backdrop-blur-sm
                    hover:border-red-500/70 hover:text-red-400 hover:bg-red-500/10 
                    transition-all duration-300"
                >
                  Reject
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onJoin(); }}
                disabled={isJoined || isJoining}
                className={cn(
                  "micro-caps text-sm px-8 py-3 rounded-full font-medium transition-all duration-300",
                  isJoined
                    ? "bg-gold/20 text-gold border border-gold/40 cursor-default"
                    : "bg-white text-void hover:bg-green-400 hover:shadow-2xl hover:shadow-green-400/30 disabled:opacity-40"
                )}
              >
                {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join Signal'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      style={{ minHeight: '45vh' }}
      className="relative overflow-hidden rounded-2xl group cursor-pointer
        border border-white/5 hover:border-white/15 transition-all duration-500"
    >
      <img
        src={`https://picsum.photos/seed/${moment.id}/900/600`}
        className="absolute inset-0 w-full h-full object-cover 
          scale-105 group-hover:scale-110 transition-transform duration-[2s]"
        alt={moment.title}
      />
      <div className="absolute inset-0 bg-gradient-to-t 
        from-black via-black/50 to-transparent" />
      
      {/* Badge top left */}
      <div className="absolute top-5 left-5 z-20">
        <span className={cn(
          "micro-caps text-xs px-3 py-1.5 rounded-full border backdrop-blur-md",
          isEvent
            ? "bg-gold/15 border-gold/40 text-gold"
            : "bg-crimson/15 border-crimson/40 text-crimson-bright"
        )}>
          {isEvent ? '◈ Event' : '⚡ Moment'}
        </span>
      </div>
      
      {/* Live dot */}
      <div className="absolute top-5 right-5 z-20">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
      
      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <h3 className="font-serif text-3xl text-white mb-4 leading-tight
          group-hover:text-gold-pale transition-colors duration-300">
          {moment.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/40 text-xs micro-caps">
            <span>{moment.participant_count ?? 0}/{moment.capacity_limit}</span>
            <span>·</span>
            <span>{distanceDisplay}</span>
            <span>·</span>
            <span>{timeDisplay}</span>
          </div>
          <div className="flex gap-2">
            {!isJoined && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="micro-caps text-xs px-3 py-2 rounded-full 
                  border border-white/15 text-white/40
                  hover:border-red-500/60 hover:text-red-400 hover:bg-red-500/10 
                  transition-all duration-300"
              >
                ✕
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={isJoined || isJoining}
              className={cn(
                "micro-caps text-xs px-5 py-2 rounded-full font-medium transition-all duration-300",
                isJoined
                  ? "bg-gold/20 text-gold border border-gold/30 cursor-default"
                  : "bg-white text-void hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/20 disabled:opacity-40"
              )}
            >
              {isJoining ? '...' : isJoined ? '✓' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TodayPage() {
  const [activeTab, setActiveTab] = useState('Now')
  const { location } = useUserLocation()
  const { moments, loading } = useNearbyMoments(location, activeTab)
  const { user } = useAuth()
  
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set())

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
    setRejectedIds(prev => new Set([...prev, momentId]))
  }

  const filteredMoments = useMemo(() => {
    return moments.filter(m => !rejectedIds.has(m.id))
  }, [moments, rejectedIds])

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-void">
      {/* Header - full width with padding */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="micro-caps text-gold text-xs tracking-[0.4em] mb-4">
              ◈ Live Discovery · Spontaneous Activity
            </p>
            <h1 className="font-serif text-[120px] leading-none text-marble 
              tracking-tight opacity-90">
              Pulse
            </h1>
          </div>
          <div className="flex flex-col items-end gap-4 mb-4">
            <div className="flex items-center gap-2 glass-panel hairline-all 
              rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="micro-caps text-xs text-marble/60">
                {filteredMoments.length} signals active
              </span>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2">
              {['Now', 'This Week', 'This Month'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'micro-caps text-xs px-5 py-2 rounded-full transition-all duration-300',
                    activeTab === tab
                      ? 'bg-marble text-void font-medium'
                      : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hairline-b" />
      </div>

      {/* Cards - full width */}
      <div className="px-8 pb-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh] gap-6"
            >
              <div className="relative">
                <Loader className="w-10 h-10 text-gold animate-spin" />
                <div className="absolute inset-0 w-10 h-10 border-t-2 border-gold rounded-full opacity-30 animate-ping" />
              </div>
              <p className="micro-caps text-[10px] text-marble/20 tracking-[0.5em]">SCANNING VICINITY</p>
            </motion.div>
          ) : filteredMoments.length > 0 ? (
            <motion.div
              key="grid-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Hero featured card */}
              <MomentCard
                moment={filteredMoments[0]}
                index={0}
                featured={true}
                isJoined={joinedIds.has(filteredMoments[0].id)}
                isJoining={joiningId === filteredMoments[0].id}
                onJoin={() => handleJoin(filteredMoments[0].id)}
                onReject={() => handleReject(filteredMoments[0].id)}
              />
              
              {/* 2-column grid for rest */}
              {filteredMoments.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMoments.slice(1).map((moment, i) => (
                    <MomentCard
                      key={moment.id}
                      moment={moment}
                      index={i + 1}
                      featured={false}
                      isJoined={joinedIds.has(moment.id)}
                      isJoining={joiningId === moment.id}
                      onJoin={() => handleJoin(moment.id)}
                      onReject={() => handleReject(moment.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center 
                min-h-[60vh] gap-6 text-center px-8"
            >
              <div className="w-24 h-24 rounded-full glass-panel hairline-all
                flex items-center justify-center mb-4">
                <Radio className="w-10 h-10 text-marble/10" />
              </div>
              <p className="font-serif text-5xl text-marble/20 mb-3">
                No signals detected
              </p>
              <p className="text-marble/20 max-w-sm">
                The vicinity is quiet. Be the first to broadcast a signal.
              </p>
              <Link to="/app/create">
                <button className="mt-4 micro-caps text-sm px-10 py-4 
                  glass-panel hairline-all rounded-full text-marble/50 
                  hover:text-marble transition-all">
                  Create Signal
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
