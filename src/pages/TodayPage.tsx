import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Radio, Users, Loader, MapPin, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Moment } from '../types'
import { cn } from '../lib/utils'

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index % 5), duration: 0.6 }}
      className="group relative h-[450px] overflow-hidden rounded-2xl border border-white/5 
        hover:border-white/10 transition-all duration-500"
    >
      <img
        src={`https://picsum.photos/seed/${moment.id}/800/1200`}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
        alt={moment.title}
      />
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
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="micro-caps text-[10px] px-4 py-2 rounded-full 
                  border border-white/20 text-marble/60 
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
  )
}

export default function TodayPage() {
  const { user } = useAuth()
  const { location } = useUserLocation()
  const [activeTab, setActiveTab] = useState('All')
  const [radius, setRadius] = useState<number>(50000) // default 50km
  
  const radiusOptions = [
    { label: '5 KM', value: 5000 },
    { label: '50 KM', value: 50000 },
    { label: 'Province', value: 150000 },
    { label: 'Country', value: 500000 },
    { label: 'Global', value: 99999999 },
  ]

  const { moments, loading } = useNearbyMoments(location, radius)
  
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('aura-rejected-ids')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

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
    setRejectedIds(prev => {
      const next = new Set([...prev, momentId])
      sessionStorage.setItem('aura-rejected-ids', JSON.stringify([...next]))
      return next
    })
  }

  const filteredMoments = useMemo(() => {
    return moments.filter(m => {
      if (rejectedIds.has(m.id)) return false
      const expiresTime = new Date(m.expires_at).getTime()
      if (expiresTime < Date.now()) return false // hide expired
      
      if (activeTab === 'Moments') return m.moment_type === 'moment'
      if (activeTab === 'Events') return m.moment_type === 'event'
      return true // 'All'
    })
  }, [moments, rejectedIds, activeTab])

  const heroMoment = filteredMoments[0]
  const gridMoments = filteredMoments.slice(1)

  if (loading && moments.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-void flex flex-col items-center justify-center gap-6">
        <Loader className="w-10 h-10 text-gold animate-spin" />
        <p className="micro-caps text-[10px] text-gold tracking-[0.5em] animate-pulse">SCANNING VICINITY</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-void min-h-screen overflow-x-hidden">
      {/* 100VH MAGAZINE HERO */}
      {heroMoment ? (
        <section className="relative h-screen w-full overflow-hidden">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src={`https://picsum.photos/seed/${heroMoment.id}/1920/1200`}
            className="absolute inset-0 h-full w-full object-cover"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          
          {/* FLOATING PULSE TITLE */}
          <div className="absolute inset-x-0 top-[20%] flex items-center justify-center pointer-events-none z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[30vw] md:text-[20vw] font-serif text-marble/5 tracking-tighter leading-none select-none"
            >
              Pulse
            </motion.h1>
          </div>

          {/* RESTORED CORE HEADER */}
          <div className="absolute top-0 left-0 right-0 p-6 md:p-12 z-30 flex flex-col md:flex-row items-start md:items-end justify-between pointer-events-none safe-area-pt">
            <div className="pointer-events-auto">
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="micro-caps text-gold text-[10px] md:text-xs tracking-[0.4em] mb-2 md:mb-4"
              >
                ◈ Live Discovery · Spontaneous
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-6xl md:text-[120px] leading-none text-marble tracking-tighter opacity-90"
              >
                Pulse
              </motion.h1>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-4 md:gap-6 mt-6 md:mt-0 pointer-events-auto">
              <div className="flex gap-1 md:gap-2 glass-panel hairline-all p-1 rounded-full bg-void/20 backdrop-blur-xl max-w-full overflow-x-auto no-scrollbar">
                {['All', 'Moments', 'Events'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "micro-caps text-[9px] md:text-[10px] px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all duration-300 whitespace-nowrap",
                      activeTab === tab 
                        ? "bg-marble text-void font-bold shadow-lg" 
                        : "text-marble/40 hover:text-marble/80"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Radius Selector */}
              <div className="flex items-center gap-2 max-w-full overflow-x-auto scrollbar-hide pb-2">
                <span className="micro-caps text-[8px] text-white/20 shrink-0 ml-2">RADIUS:</span>
                {radiusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRadius(opt.value)}
                    className={cn(
                      "micro-caps text-[8px] px-3 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap",
                      radius === opt.value
                        ? "bg-gold/10 border-gold/40 text-gold"
                        : "border-white/5 text-white/30 hover:border-white/20"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-void/40 backdrop-blur-md border border-white/5 self-start md:self-end">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="micro-caps text-[9px] text-white/40 tracking-widest">{filteredMoments.length} Signals Intercepted</span>
              </div>
            </div>
          </div>

          {/* HERO CONTENT FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 mb-6"
              >
                <span className="micro-caps text-xs px-4 py-1.5 bg-gold/10 border border-gold/30 text-gold rounded-full backdrop-blur-md">
                  Featured Signal
                </span>
                <span className="micro-caps text-xs px-4 py-1.5 bg-white/5 border border-white/10 text-white/50 rounded-full backdrop-blur-md">
                  {heroMoment.location_name || 'Nearby'}
                </span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="font-serif text-4xl md:text-8xl text-white mb-6 leading-[0.9] tracking-tight"
              >
                {heroMoment.title}
              </motion.h2>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(4, heroMoment.participant_count || 0))].map((_, i) => (
                      <img 
                        key={i} 
                        src={`https://i.pravatar.cc/100?u=${heroMoment.id}-${i}`}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-void" 
                        alt="p"
                      />
                    ))}
                  </div>
                  <span className="micro-caps text-[10px] text-marble/40">
                    {heroMoment.participant_count || 0} Attending
                  </span>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {!joinedIds.has(heroMoment.id) && (
                    <button
                      onClick={() => handleReject(heroMoment.id)}
                      className="flex-1 md:flex-none micro-caps text-[10px] md:text-sm px-6 py-3 md:py-4 rounded-full border border-white/20 text-white/60 
                        backdrop-blur-md hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleJoin(heroMoment.id)}
                    disabled={joinedIds.has(heroMoment.id) || joiningId === heroMoment.id}
                    className={cn(
                      "flex-[2] md:flex-none micro-caps text-[10px] md:text-sm px-8 py-3 md:py-4 rounded-full font-bold transition-all duration-300",
                      joinedIds.has(heroMoment.id)
                        ? "bg-gold/20 text-gold border border-gold/40 cursor-default"
                        : "bg-marble text-void hover:bg-green-400 hover:text-void hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]"
                    )}
                  >
                    {joiningId === heroMoment.id ? 'Processing...' : joinedIds.has(heroMoment.id) ? 'Joined' : 'Join Signal'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-void">
           <Radio className="w-16 h-16 text-marble/5 mb-8" />
           <h1 className="font-serif text-5xl text-marble/20 mb-4">Silence in the Void</h1>
           <p className="text-marble/20 max-w-sm mb-8">No signals detected in your immediate vicinity. Be the one to break the quiet.</p>
           <Link to="/app/create">
             <button className="micro-caps text-sm px-10 py-4 glass-panel hairline-all rounded-full text-marble/50 hover:text-marble transition-all">
               Initialize Signal
             </button>
           </Link>
        </div>
      )}

      {/* EDITORIAL GRID */}
      {gridMoments.length > 0 && (
        <section className="px-6 md:px-8 py-12 md:py-24 w-full">
          <div className="flex items-end justify-between mb-8 md:mb-16 px-2">
            <div>
              <span className="micro-caps text-[10px] md:text-xs text-gold tracking-[0.4em] mb-2 block">◈ More Signals</span>
              <h2 className="font-serif text-4xl md:text-5xl text-marble">Current Pulse</h2>
            </div>
            <div className="text-right hidden md:block">
              <span className="micro-caps text-[10px] text-marble/30">SCROLL TO DISCOVER</span>
              <div className="h-10 w-[1px] bg-gradient-to-b from-marble/30 to-transparent mx-auto mt-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridMoments.map((moment, i) => (
              <MomentGridCard
                key={moment.id}
                moment={moment}
                index={i}
                isJoined={joinedIds.has(moment.id)}
                isJoining={joiningId === moment.id}
                onJoin={() => handleJoin(moment.id)}
                onReject={() => handleReject(moment.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Spacer */}
      <div className="h-32" />
    </div>
  )
}
