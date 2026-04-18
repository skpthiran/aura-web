import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Loader, MapPin } from 'lucide-react'
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
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, featured, isJoined, isJoining, onJoin, onReject }) => {
  const distanceDisplay = moment.distance_meters 
    ? moment.distance_meters < 1000
      ? `${Math.round(moment.distance_meters)}m`
      : `${(moment.distance_meters / 1000).toFixed(1)}km`
    : 'nearby'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ minHeight: featured ? '480px' : '280px' }}
    >
      {/* Background image from Unsplash based on title */}
      <img 
        src={`https://source.unsplash.com/800x600/?${encodeURIComponent(moment.title)},night,city`}
        className="absolute inset-0 w-full h-full object-cover 
          group-hover:scale-105 transition-transform duration-700"
        alt={moment.title}
      />
      
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-void 
        via-void/40 to-transparent" />
      
      {/* Top left: type badge + location */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-crimson-bright animate-pulse" />
        <span className="micro-caps text-xs text-marble/70">
          {moment.moment_type.toUpperCase()} · {distanceDisplay}
        </span>
      </div>
      
      {/* Top right: live indicator dot */}
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 rounded-full bg-crimson-bright" />
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className={cn(
          "font-serif text-marble mb-3",
          featured ? "text-4xl" : "text-2xl"
        )}>
          {moment.title}
        </h3>
        
        {/* Participant avatars row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Stacked avatar circles */}
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, moment.participant_count ?? 0))].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 
                  border-void bg-marble/20 overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/28?img=${i + 10}`}
                    className="w-full h-full object-cover"
                    alt="participant"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-marble/60 micro-caps">
              {moment.participant_count ?? 0}/{moment.capacity_limit} JOINED
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            {!isJoined && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="micro-caps text-xs px-4 py-2 rounded-full 
                  border border-white/20 text-marble/60 
                  hover:border-white/40 hover:text-marble transition-all"
              >
                Reject
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={isJoined || isJoining}
              className={cn(
                "micro-caps text-xs px-4 py-2 rounded-full transition-all",
                isJoined 
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "bg-marble text-void hover:bg-gold-pale"
              )}
            >
              {isJoining ? "..." : isJoined ? "Joined" : "Join"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TodayPage() {
  const { location } = useUserLocation()
  const { moments, loading, error } = useNearbyMoments(location)
  const { user } = useAuth()
  
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('Live Now')
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-6xl text-marble tracking-wide mb-1 uppercase">
              Pulse
            </h1>
            <p className="micro-caps text-xs text-marble/40">
              Live Discovery · Spontaneous Activity
            </p>
          </div>
          <div className="flex gap-1 p-1 glass-panel rounded-full w-fit">
            {['Live Now', 'Later Tonight', 'This Weekend'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'micro-caps text-xs px-4 py-2 rounded-full transition-all',
                  activeTab === tab 
                    ? 'bg-marble text-void' 
                    : 'text-marble/40 hover:text-marble/60'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Location warning banner */}
        {!location && !loading && (
          <div className="mb-8 px-4 py-3 bg-crimson/10 border border-crimson/20 
            rounded-xl flex items-center gap-3">
            <MapPin className="w-4 h-4 text-crimson-bright shrink-0" />
            <p className="text-sm text-crimson-bright">
              Enable location access to detect signals in your vicinity
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Loader className="w-8 h-8 text-gold animate-spin" />
            <p className="micro-caps text-marble/30">Scanning vicinity...</p>
          </div>
        )}

        {/* Bento grid */}
        {!loading && displayedMoments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Featured large card */}
            <div className="lg:col-span-2">
              <MomentCard 
                moment={displayedMoments[0]} 
                featured={true}
                isJoined={joinedIds.has(displayedMoments[0].id)}
                isJoining={joiningId === displayedMoments[0].id}
                onJoin={() => handleJoin(displayedMoments[0].id)}
                onReject={() => handleReject(displayedMoments[0].id)}
              />
            </div>
            
            {/* Side cards column */}
            <div className="flex flex-col gap-4">
              {displayedMoments.slice(1, 3).map(moment => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  featured={false}
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
                isJoined={joinedIds.has(moment.id)}
                isJoining={joiningId === moment.id}
                onJoin={() => handleJoin(moment.id)}
                onReject={() => handleReject(moment.id)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayedMoments.length === 0 && (
          <div className="flex flex-col items-center justify-center 
            min-h-[60vh] gap-6 text-center">
            <div className="w-16 h-16 rounded-full glass-panel 
              flex items-center justify-center">
              <Radio className="w-6 h-6 text-marble/20" />
            </div>
            <div>
              <p className="font-serif text-3xl text-marble/40 mb-2">
                No signals detected
              </p>
              <p className="text-sm text-marble/20 max-w-xs">
                The vicinity is quiet. Be the first to broadcast.
              </p>
            </div>
            <Link to="/app/create">
              <button className="micro-caps text-sm px-6 py-3 
                bg-marble/10 border border-white/10 rounded-full 
                text-marble/60 hover:text-marble transition-all">
                Create Signal
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
