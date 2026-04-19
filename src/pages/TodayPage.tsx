import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Loader, MapPin, Zap, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'

interface MomentCardProps {
  moment: Moment
  featured: boolean
  isJoined: boolean
  isJoining: boolean
  onJoin: () => void | Promise<void>
  onReject: () => void
  className?: string
  height?: string
}

const MomentCard: React.FC<MomentCardProps> = ({ 
  moment, 
  featured, 
  isJoined, 
  isJoining, 
  onJoin, 
  onReject,
  className,
  height
}) => {
  const isEvent = moment.moment_type === 'event'
  const distanceDisplay = moment.distance_meters 
    ? moment.distance_meters < 1000
      ? `${Math.round(moment.distance_meters)}m`
      : `${(moment.distance_meters / 1000).toFixed(1)}km`
    : 'nearby'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer group",
        "border transition-all duration-500",
        "hover:shadow-2xl",
        isEvent 
          ? "border-gold/20 hover:border-gold/60 hover:shadow-gold/10" 
          : "border-white/10 hover:border-crimson/40 hover:shadow-crimson/10",
        className
      )}
      style={{ height: height || (featured ? '520px' : '280px') }}
    >
      {/* Background image from Picsum based on ID */}
      <img 
        src={`https://picsum.photos/seed/${moment.id}/1200/800`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        alt={moment.title}
      />
      
      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 z-10" />
      
      {/* Top left: type badge + location */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          isEvent ? "bg-gold" : "bg-crimson-bright"
        )} />
        <span className="micro-caps text-[10px] text-marble/70 tracking-widest">
          {moment.moment_type.toUpperCase()} · {distanceDisplay}
        </span>
      </div>
      
      {/* Top right: live indicator dot */}
      <div className="absolute top-4 right-4 z-20">
        <div className={cn(
          "px-2 py-0.5 rounded-full border border-white/10 glass-panel micro-caps text-[8px] text-marble/40",
          "group-hover:border-white/20 transition-colors"
        )}>
          LIVE
        </div>
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <h3 className={cn(
          "font-serif text-marble mb-3 transition-transform duration-500",
          "group-hover:-translate-y-1",
          featured ? "text-4xl" : "text-xl"
        )}>
          {moment.title}
        </h3>
        
        {/* Participant avatars row and Action buttons */}
        <div className={cn(
          "flex items-center justify-between",
          featured && "flex-col md:flex-row gap-6 md:gap-0"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, moment.participant_count ?? 0))].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-void bg-marble/20 overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/32?img=${(parseInt(moment.id.slice(-2), 16) || 0) + i}`}
                    className="w-full h-full object-cover"
                    alt="participant"
                  />
                </div>
              ))}
            </div>
            <span className="text-[10px] text-marble/40 micro-caps tracking-wider">
              {moment.participant_count ?? 0}/{moment.capacity_limit} JOINED
            </span>
          </div>
          
          {/* Action buttons with sliding effect on featured */}
          <div className={cn(
            "flex gap-3",
            featured && "transition-all duration-500 translate-y-2 group-hover:translate-y-0 opacity-70 group-hover:opacity-100"
          )}>
            {!isJoined && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="micro-caps text-xs px-4 py-2 rounded-full border border-white/20 text-marble/60 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                REJECT
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={isJoined || isJoining}
              className={cn(
                "micro-caps text-xs px-4 py-2 rounded-full transition-all duration-300",
                isJoined 
                  ? "bg-gold/20 text-gold border border-gold/30 cursor-default"
                  : "bg-marble text-void hover:bg-green-400 hover:text-void hover:shadow-lg hover:shadow-green-400/20 font-medium"
              )}
            >
              {isJoining ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : isJoined ? (
                <><Check className="w-3 h-3" /> JOINED</>
              ) : (
                <>JOIN <Zap className="w-3 h-3" /></>
              )}
              
              {/* Shimmer effect for Join button */}
              {!isJoined && !isJoining && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
              )}
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
  const { moments, loading, error } = useNearbyMoments(location, activeTab)
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

  const displayedMoments = moments.filter(m => !rejectedIds.has(m.id))

  const tabs = ['Now', 'This Week', 'This Month']

  return (
    <div className="min-h-screen bg-void flex-1 overflow-y-auto">
      <div className="p-6 pt-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="hairline-b pb-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-6xl text-marble tracking-wide mb-2 uppercase leading-none">
                Pulse
              </h1>
              <p className="micro-caps text-xs text-marble/30 tracking-[0.4em]">
                LIVE DISCOVERY · SPONTANEOUS ACTIVITY
              </p>
            </div>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-full w-fit relative">
              {tabs.map(tab => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'relative micro-caps text-[10px] px-5 py-2.5 rounded-full transition-colors duration-300 z-10',
                      isActive ? 'text-void font-bold' : 'text-marble/40 hover:text-marble/60'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-marble rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Location warning banner */}
        {!location && !loading && (
          <div className="mb-8 px-6 py-4 bg-crimson/5 border border-crimson/10 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-crimson/10 flex items-center justify-center border border-crimson/20">
              <MapPin className="w-5 h-5 text-crimson-bright animate-bounce" />
            </div>
            <div>
              <p className="micro-caps text-xs text-crimson-bright mb-1 tracking-widest">Localization Failed</p>
              <p className="text-xs text-marble/40">Enable sensor access to detect signals in your immediate vicinity</p>
            </div>
          </div>
        )}

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
          ) : displayedMoments.length > 0 ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-3"
            >
              {/* Featured large card (2/3 width) */}
              <div className="lg:col-span-2">
                <MomentCard 
                  moment={displayedMoments[0]} 
                  featured={true}
                  height="520px"
                  isJoined={joinedIds.has(displayedMoments[0].id)}
                  isJoining={joiningId === displayedMoments[0].id}
                  onJoin={() => handleJoin(displayedMoments[0].id)}
                  onReject={() => handleReject(displayedMoments[0].id)}
                />
              </div>
              
              {/* Side cards column */}
              <div className="flex flex-col gap-3">
                {displayedMoments.slice(1, 3).map(moment => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    featured={false}
                    height="250px"
                    isJoined={joinedIds.has(moment.id)}
                    isJoining={joiningId === moment.id}
                    onJoin={() => handleJoin(moment.id)}
                    onReject={() => handleReject(moment.id)}
                  />
                ))}
              </div>
              
              {/* Bottom row for remaining moments */}
              {displayedMoments.slice(3).map(moment => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  featured={false}
                  height="300px"
                  isJoined={joinedIds.has(moment.id)}
                  isJoining={joiningId === moment.id}
                  onJoin={() => handleJoin(moment.id)}
                  onReject={() => handleReject(moment.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border border-white/5 bg-void flex items-center justify-center shadow-2xl">
                  <Radio className="w-8 h-8 text-marble/10" />
                </div>
                <div className="absolute -inset-4 border border-gold/5 rounded-full animate-pulse" />
              </div>
              <div className="space-y-3">
                <p className="font-serif text-4xl text-marble/30 tracking-tight">
                  No signals detected
                </p>
                <p className="micro-caps text-[10px] text-marble/10 tracking-[0.3em] max-w-xs">
                  THE VICINITY IS SILENT. INITIATE A BROADCAST TO SIGNAL YOUR PRESENCE.
                </p>
              </div>
              <Link to="/app/create">
                <button className="micro-caps text-[10px] px-8 py-3.5 bg-gold/5 border border-gold/20 rounded-full text-gold hover:bg-gold hover:text-void transition-all tracking-widest">
                  INITIATE SIGNAL
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
