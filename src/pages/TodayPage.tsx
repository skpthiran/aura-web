import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Loader, MapPin, Zap, Check, Users, Users2 } from 'lucide-react'
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
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden rounded-3xl group cursor-pointer",
          "border transition-all duration-700",
          isEvent 
            ? "border-gold/20 hover:border-gold/50" 
            : "border-white/5 hover:border-crimson/30"
        )}
        style={{ minHeight: '560px' }}
      >
        {/* Full bleed image */}
        <img
          src={`https://picsum.photos/seed/${moment.id}/1400/800`}
          className="absolute inset-0 w-full h-full object-cover 
            transition-transform duration-[2s] ease-out group-hover:scale-110"
          alt={moment.title}
        />
        
        {/* Multi-layer gradient */}
        <div className="absolute inset-0 bg-gradient-to-t 
          from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r 
          from-black/60 via-transparent to-transparent" />
        
        {/* Noise texture overlay for luxury feel */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }}
        />
        
        {/* Top badges */}
        <div className="absolute top-6 left-6 right-6 flex 
          items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className={cn(
              "micro-caps text-xs px-3 py-1.5 rounded-full border backdrop-blur-sm",
              isEvent 
                ? "bg-gold/10 border-gold/40 text-gold" 
                : "bg-crimson/10 border-crimson/40 text-crimson-bright"
            )}>
              {isEvent ? '◈ Event' : '⚡ Moment'}
            </span>
            <span className="micro-caps text-xs text-white/50 
              backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full">
              {distanceDisplay}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          {/* Tags */}
          {moment.tags && moment.tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {moment.tags.slice(0, 3).map(tag => (
                <span key={tag} className="micro-caps text-xs px-2 py-1 
                  rounded-full border border-white/20 text-white/50 
                  backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <h3 className="font-serif text-5xl text-white mb-2 leading-tight
            group-hover:text-gold-pale transition-colors duration-500">
            {moment.title}
          </h3>
          
          {moment.description && (
            <p className="text-white/50 text-sm mb-6 max-w-lg line-clamp-2">
              {(moment.description as string)}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {/* Avatars + count */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(Math.min(4, Math.max(0, moment.participant_count ?? 0)))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 
                    border-black/50 bg-marble/20 overflow-hidden">
                    <img src={`https://i.pravatar.cc/32?img=${(parseInt(moment.id.slice(-2), 16) || 0) + i}`} 
                      className="w-full h-full object-cover" alt="user" />
                  </div>
                ))}
              </div>
              <span className="text-white/50 text-xs micro-caps">
                {moment.participant_count ?? 0}/{moment.capacity_limit} joined
              </span>
              <span className="text-white/30 text-xs micro-caps">
                · {timeDisplay}
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              {!isJoined && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(); }}
                  className="micro-caps text-xs px-5 py-2.5 rounded-full 
                    border border-white/20 text-white/50 backdrop-blur-sm
                    hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 
                    transition-all duration-300"
                >
                  Reject
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onJoin(); }}
                disabled={isJoined || isJoining}
                className={cn(
                  "micro-caps text-xs px-6 py-2.5 rounded-full font-medium relative overflow-hidden",
                  "transition-all duration-300",
                  isJoined
                    ? "bg-gold/20 text-gold border border-gold/30 cursor-default"
                    : "bg-white text-void hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/30 disabled:opacity-50"
                )}
              >
                {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
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
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl group cursor-pointer",
        "border transition-all duration-500",
        isEvent
          ? "border-gold/15 hover:border-gold/40"
          : "border-white/5 hover:border-crimson/25"
      )}
      style={{ minHeight: '260px' }}
    >
      <img
        src={`https://picsum.photos/seed/${moment.id}/800/500`}
        className="absolute inset-0 w-full h-full object-cover 
          transition-transform duration-700 group-hover:scale-110"
        alt={moment.title}
      />
      <div className="absolute inset-0 bg-gradient-to-t 
        from-black via-black/70 to-black/20" />
      
      {/* Live dot */}
      <div className="absolute top-4 right-4 z-20">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      
      {/* Type badge */}
      <div className="absolute top-4 left-4 z-20">
        <span className={cn(
          "micro-caps text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm",
          isEvent
            ? "bg-gold/10 border-gold/30 text-gold"
            : "bg-crimson/10 border-crimson/30 text-crimson-bright"
        )}>
          {isEvent ? '◈ Event' : '⚡ Moment'}
        </span>
      </div>
      
      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
        <h3 className="font-serif text-2xl text-white mb-3 leading-tight
          group-hover:text-gold-pale transition-colors duration-300">
          {moment.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs micro-caps flex items-center gap-1">
              <Users className="w-3 h-3" />
              {moment.participant_count ?? 0}/{moment.capacity_limit}
            </span>
            <span className="text-white/30 text-xs micro-caps">
              {distanceDisplay}
            </span>
          </div>
          
          <div className="flex gap-2">
            {!isJoined && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="micro-caps text-xs px-3 py-1.5 rounded-full 
                  border border-white/15 text-white/40
                  hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 
                  transition-all duration-300"
              >
                Reject
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={isJoined || isJoining}
              className={cn(
                "micro-caps text-xs px-4 py-1.5 rounded-full font-medium",
                "transition-all duration-300",
                isJoined
                  ? "bg-gold/20 text-gold border border-gold/30 cursor-default"
                  : "bg-white text-void hover:bg-green-400 hover:shadow-md hover:shadow-green-400/20 disabled:opacity-50"
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
    <div className="min-h-screen bg-void flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 
              bg-gold/5 rounded-full blur-[120px]" />
            <div className="absolute top-0 right-1/4 w-64 h-64 
              bg-crimson/5 rounded-full blur-[80px]" />
          </div>
          
          <div className="relative px-6 pt-10 pb-8">
            {/* Top row */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="micro-caps text-gold text-xs tracking-[0.3em] mb-3"
                >
                  ◈ Live Discovery · Spontaneous Activity
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-serif text-7xl text-marble leading-none 
                    tracking-tight"
                >
                  Pulse
                </motion.h1>
              </div>
              
              {/* Live indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 glass-panel hairline-all 
                  rounded-full px-4 py-2 mt-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 
                  animate-pulse" />
                <span className="micro-caps text-xs text-marble/60">
                  {filteredMoments.length} active
                </span>
              </motion.div>
            </div>
            
            {/* Filter tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2"
            >
              {['Now', 'This Week', 'This Month'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'micro-caps text-xs px-5 py-2.5 rounded-full transition-all duration-300',
                    activeTab === tab
                      ? 'bg-marble text-void font-medium shadow-lg'
                      : 'glass-panel hairline-all text-marble/40 hover:text-marble/80'
                  )}
                >
                  {tab}
                </button>
              ))}
            </motion.div>
          </div>
          
          {/* Bottom hairline */}
          <div className="hairline-b mx-6" />
        </div>

        <div className="p-6 pt-8">
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
                className="flex flex-col gap-5"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  min-h-[50vh] gap-6 text-center"
              >
                <div className="w-20 h-20 rounded-full glass-panel hairline-all
                  flex items-center justify-center">
                  <Radio className="w-8 h-8 text-marble/10" />
                </div>
                <div>
                  <p className="font-serif text-3xl text-marble/30 mb-2">
                    No signals detected
                  </p>
                  <p className="text-sm text-marble/20 max-w-xs">
                    The vicinity is quiet. Be the first to broadcast.
                  </p>
                </div>
                <Link to="/app/create">
                  <button className="micro-caps text-sm px-8 py-3 
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
    </div>
  )
}
