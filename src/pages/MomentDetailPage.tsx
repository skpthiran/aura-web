import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getMomentById, joinMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import { 
  ArrowLeft, MapPin, Clock, Users, Calendar, 
  Zap, Tag, MessageSquare, Share2, Loader, Copy, Check,
  MoreVertical, Shield, Flag, Bell, Navigation, AlertTriangle
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'

export default function MomentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [moment, setMoment] = useState<Moment | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)
  const [isFull, setIsFull] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [waitlistTotal, setWaitlistTotal] = useState(0)
  const [creator, setCreator] = useState<{
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  } | null>(null)
  
  usePageTitle(moment ? moment.title : 'Signal Intel')

  useEffect(() => {
    async function fetchMoment() {
      if (!id) return
      try {
        const data = await getMomentById(id)
        if (!data) {
          setLoading(false)
          return
        }
        setMoment(data)
        const currentCount = data.participant_count || 0
        setParticipantCount(currentCount)
        setIsFull(currentCount >= (data.capacity_limit || 999))
        
        // Fetch waitlist count
        const { count: wlCount } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('moment_id', id)
          .eq('status', 'waitlist')
        setWaitlistTotal(wlCount || 0)

        // Check if user is already a participant
        if (user) {
          const { data: participant } = await supabase
            .from('participants')
            .select('status, position')
            .eq('moment_id', id)
            .eq('user_id', user.id)
            .single()
          
          if (participant) {
            setIsJoined(true)
            if (participant.status === 'waitlist') {
              setWaitlistPosition(participant.position)
            }
          }
        }

        // Fetch creator profile
        if (data.creator_id) {
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', data.creator_id)
            .single()
          if (creatorData) setCreator(creatorData)
        }
      } catch (err) {
        console.error('Failed to fetch moment:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMoment()
  }, [id, user])

  // Realtime participant sync
  useEffect(() => {
    if (!id) return

    const channelName = `participants-sync:${id}:${Math.random().toString(36).slice(2)}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `moment_id=eq.${id}`,
        },
        async () => {
          // Re-fetch counts for absolute state accuracy
          const { count: joinedCount } = await supabase
            .from('participants')
            .select('id', { count: 'exact', head: true })
            .eq('moment_id', id)
            .eq('status', 'joined')
          
          const { count: wlCount } = await supabase
            .from('participants')
            .select('id', { count: 'exact', head: true })
            .eq('moment_id', id)
            .eq('status', 'waitlist')

          setParticipantCount(joinedCount || 0)
          setWaitlistTotal(wlCount || 0)
          
          if (moment) {
            setIsFull((joinedCount || 0) >= (moment.capacity_limit || 999))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, moment])

  const handleJoin = async () => {
    if (!user || !moment || joining || isJoined) return
    setJoining(true)
    try {
      const res = await joinMoment(moment.id)
      setIsJoined(true)
      if (res.status === 'waitlist') {
        setWaitlistPosition(res.position || null)
        setWaitlistTotal(prev => prev + 1)
      } else {
        setParticipantCount(prev => prev + 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setJoining(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: moment?.title || 'Aura Signal',
          text: moment?.description || 'Check out this signal on Aura',
          url
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Error copying:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-void min-h-screen">
        <Loader className="w-8 h-8 text-gold animate-spin mb-4" />
        <span className="micro-caps text-xs text-white/30 tracking-[0.3em]">Decrypting Signal...</span>
      </div>
    )
  }

  if (!moment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-void min-h-screen p-8 text-center">
        <Shield className="w-16 h-16 text-crimson/20 mb-6" />
        <h1 className="font-serif text-3xl text-marble mb-4">Signal Lost</h1>
        <p className="text-marble/40 mb-8 max-w-xs">The signal you are looking for has expired or been withdrawn from the network.</p>
        <button 
          onClick={() => navigate(-1)}
          className="micro-caps text-sm px-8 py-3 glass-panel hairline-all rounded-full text-marble/60 hover:text-marble transition-all"
        >
          Return to Pulse
        </button>
      </div>
    )
  }

  const isEvent = moment.moment_type === 'event'
  const timeRemaining = moment.expires_at ? new Date(moment.expires_at).getTime() - Date.now() : 0
  const hoursLeft = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
  const isExpired = timeRemaining <= 0

  // Calculate duration if both exist
  let durationText = ''
  if (moment.start_time && moment.end_time) {
    const start = new Date(moment.start_time)
    const end = new Date(moment.end_time)
    const diffMs = end.getTime() - start.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffHrs > 0) {
      durationText = `${diffHrs}h ${diffMins > 0 ? `${diffMins}m` : ''}`
    } else {
      durationText = `${diffMins}m`
    }
  }

  return (
    <div className="flex-1 bg-void min-h-screen relative overflow-x-hidden safe-area-pb">
      {/* ── HERO SECTION ── */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={`https://picsum.photos/seed/${moment.id}/1920/1080`}
          className="absolute inset-0 w-full h-full object-cover"
          alt={moment.title}
          onError={(e) => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        
        {/* Navigation Overlays */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-30 safe-area-pt">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
             <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all">
                <Bell className="w-5 h-5" />
             </button>
             <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all">
                <MoreVertical className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={cn(
                  "micro-caps text-[10px] px-3 py-1 rounded-full backdrop-blur-md border uppercase tracking-widest",
                  isEvent ? "bg-crimson/10 border-crimson/30 text-crimson-bright" : "bg-gold/10 border-gold/30 text-gold"
                )}>
                  {isEvent ? 'Class Alpha Event' : 'Spontaneous Signal'}
                </span>
                <span className="micro-caps text-[10px] text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                   {moment.distance_meters ? `${(moment.distance_meters / 1000).toFixed(1)}KM DISTANCE` : 'PROXIMITY UNIDENTIFIED'}
                </span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-8xl text-marble mb-6 leading-[0.9] tracking-tight text-shadow-glow">
                {moment.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONTENT BODY ── */}
      <section className="px-6 md:px-12 py-12 md:py-20 relative z-10 -mt-10 md:-mt-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Main Content Column */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 rounded-[32px] mb-10">
              <h3 className="micro-caps text-xs text-gold mb-6 tracking-[0.3em]">MISSION DESCRIPTION</h3>
              <p className="text-marble/70 text-lg md:text-xl leading-relaxed font-light mb-8">
                {moment.description || "No further intelligence provided for this signal. Approach with presence and awareness."}
              </p>
              
              {moment.tags && moment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {moment.tags.map(tag => (
                    <span key={tag} className="text-[10px] micro-caps px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-marble/40">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {creator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="mb-6"
              >
                <Link to={`/app/user/${creator.id}`}>
                  <div className="flex items-center gap-3 glass-panel hairline-all
                    rounded-2xl px-4 py-3 hover:border-white/20 transition-all
                    cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-marble/10
                      border border-white/15 overflow-hidden flex items-center 
                      justify-center shrink-0">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display='none' }}
                        />
                      ) : (
                        <span className="font-serif text-sm text-marble/50">
                          {(creator.full_name ?? 'A')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="micro-caps text-xs text-marble/40 mb-0.5">
                        Created by
                      </p>
                      <p className="text-sm text-marble group-hover:text-gold-pale
                        transition-colors truncate font-medium">
                        {creator.full_name ?? 'Anonymous'}
                      </p>
                      {creator.username && (
                        <p className="micro-caps text-xs text-marble/30">
                          @{creator.username}
                        </p>
                      )}
                    </div>
                    <span className="text-marble/20 group-hover:text-marble/50
                      transition-colors text-sm">→</span>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Timing section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel hairline-all rounded-2xl overflow-hidden mb-6"
            >
              {/* Start time row */}
              {moment.start_time ? (
                <div className="flex items-center gap-4 px-5 py-4 hairline-b">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20
                    flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="micro-caps text-xs text-marble/40 mb-0.5">
                      {isEvent ? 'Event Starts' : 'Starts'}
                    </p>
                    <p className="text-marble text-sm font-medium">
                      {new Date(moment.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(moment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* End / Duration row */}
              <div className="flex items-center gap-4 px-5 py-4 bg-white/[0.02]">
                <div className="w-9 h-9 rounded-xl bg-marble/5 border border-white/10
                  flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-marble/40" />
                </div>
                
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="micro-caps text-[10px] text-marble/20 mb-0.5">
                      {isEvent ? 'Approx. Duration' : 'Signal Duration'}
                    </p>
                    <p className="text-marble text-sm">
                      {durationText || (hoursLeft > 0 ? `${hoursLeft} hours remaining` : 'Expiring soon')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="micro-caps text-[10px] text-marble/20 mb-0.5">Status</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isExpired ? "bg-marble/20" : "bg-gold animate-pulse"
                      )} />
                      <span className={cn(
                        "text-[10px] micro-caps font-bold tracking-widest",
                        isExpired ? "text-marble/30" : "text-gold"
                      )}>
                        {isExpired ? 'SIGNAL EXPIRED' : 'LIVE ON NETWORK'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              <div className="glass-panel hairline-all rounded-2xl p-4 text-center relative overflow-hidden group">
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1 h-1 rounded-full bg-gold" 
                  />
                </div>
                <Users className={cn(
                  "w-4 h-4 mx-auto mb-2 transition-colors",
                  participantCount > 0 ? "text-gold" : "text-marble/20"
                )} />
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={participantCount}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-serif text-2xl text-marble"
                  >
                    {participantCount}
                  </motion.p>
                </AnimatePresence>
                <p className="micro-caps text-[10px] text-marble/30">
                  {waitlistTotal > 0 ? `+${waitlistTotal} waiting` : `/ ${moment.capacity_limit || '∞'} spots`}
                </p>
              </div>
              <div className="glass-panel hairline-all rounded-2xl p-4 text-center">
                {isEvent
                  ? <Calendar className="w-4 h-4 text-gold mx-auto mb-2" />
                  : <Zap className="w-4 h-4 text-gold mx-auto mb-2" />
                }
                <p className="font-serif text-2xl text-marble">
                  {isEvent ? 'Event' : 'Moment'}
                </p>
                <p className="micro-caps text-xs text-marble/30">type</p>
              </div>
            </motion.div>

            {/* Venue */}
            {(moment as any).venue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="glass-panel hairline-all rounded-2xl p-5 mb-6"
              >
                <div className="flex items-center gap-3 mb-1">
                  <MapPin className="w-4 h-4 text-gold" />
                  <p className="micro-caps text-xs text-marble/40">Venue</p>
                </div>
                <p className="text-marble text-sm ml-7">{(moment as any).venue}</p>
              </motion.div>
            )}

            {/* Dress code + Age range row */}
            {((moment as any).dresscode || (moment as any).age_min) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {(moment as any).dresscode && (
                  <div className="glass-panel hairline-all rounded-2xl p-4 text-center">
                    <p className="micro-caps text-xs text-marble/30 mb-1">Dress Code</p>
                    <p className="text-marble text-sm font-medium">
                      {(moment as any).dresscode}
                    </p>
                  </div>
                )}
                {(moment as any).age_min && (
                  <div className="glass-panel hairline-all rounded-2xl p-4 text-center">
                    <p className="micro-caps text-xs text-marble/30 mb-1">Age Range</p>
                    <p className="text-marble text-sm font-medium">
                      {(moment as any).age_min}+
                      {(moment as any).age_max ? ` – ${(moment as any).age_max}` : ''}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Private badge */}
            {(moment as any).is_private && (
              <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-gold/5 border border-gold/20 rounded-xl">
                <span className="micro-caps text-xs text-gold">
                  ◈ Private Signal — Invite Only
                </span>
              </div>
            )}

            {/* LOCATION FOOTNOTE */}
            <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                 <p className="micro-caps text-[9px] text-marble/40 tracking-widest mb-1">VECTOR COORDINATES</p>
                 <p className="text-sm text-marble/80">
                   {moment.lat?.toFixed(4)}, {moment.lng?.toFixed(4)} · <span className="text-gold">NAVIGATE VIA HUB</span>
                 </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-marble/30 hover:text-marble transition-all">
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Column */}
          <div className="lg:col-span-5 space-y-6">
             {/* REGISTRATION PANEL */}
              <div className="glass-panel p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16" />
                
                <h2 className="font-serif text-3xl text-marble mb-2">Engage Signal</h2>
                <p className="text-xs text-marble/40 micro-caps tracking-widest mb-8">
                  {waitlistPosition ? `WAITLIST POSITION: #${waitlistPosition}` : `CONNECTION STATUS: ${isJoined ? 'ACTIVE' : 'IDLE'}`}
                </p>

                {/* Capacity progress bar */}
                {moment.capacity_limit && (
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="micro-caps text-[10px] text-marble/40">Network Capacity</span>
                      <span className="text-[10px] text-marble/60 font-mono">
                        {participantCount}/{moment.capacity_limit}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (participantCount / moment.capacity_limit) * 100)}%` }}
                        className={cn(
                          "h-full rounded-full",
                          isFull ? "bg-crimson-bright shadow-[0_0_10px_rgba(255,50,50,0.5)]" : "bg-gold"
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <button 
                    onClick={handleJoin}
                    disabled={isJoined || joining}
                    className={cn(
                      "w-full py-5 rounded-2xl micro-caps text-sm tracking-[0.3em] font-bold transition-all shadow-xl flex items-center justify-center gap-3",
                      isJoined 
                        ? (waitlistPosition ? "bg-crimson/10 text-crimson-bright border border-crimson/30" : "bg-gold/10 text-gold border border-gold/30") 
                        : (isFull ? "bg-white/10 text-marble border border-white/20" : "bg-gold text-void hover:bg-gold-pale hover:shadow-gold/20")
                    )}
                  >
                    {joining ? (
                      <><Loader className="w-5 h-5 animate-spin" /> PROCESSING</>
                    ) : waitlistPosition ? (
                      <><Shield className="w-5 h-5" /> ON WAITLIST #{waitlistPosition}</>
                    ) : isJoined ? (
                      <><Zap className="w-5 h-5 animate-pulse" /> CONNECTION ESTABLISHED</>
                    ) : isFull ? (
                      <><AlertTriangle className="w-5 h-5" /> JOIN WAITLIST</>
                    ) : (
                      <><Zap className="w-5 h-5" /> INITIALIZE ENGAGEMENT</>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleShare}
                      className="py-4 rounded-xl glass-panel hairline-all micro-caps text-[10px] tracking-widest text-marble/60 hover:text-marble transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      {copied ? 'COPIED' : 'SHARE'}
                    </button>
                    
                    <Link to={isJoined && !waitlistPosition ? `/app/chat?id=${moment.id}` : '#'} 
                      className={cn(
                        "py-4 rounded-xl glass-panel hairline-all micro-caps text-[10px] tracking-widest transition-all flex items-center justify-center gap-2",
                        isJoined && !waitlistPosition ? "text-marble/60 hover:text-marble cursor-pointer" : "text-marble/10 cursor-not-allowed"
                      )}
                      onClick={(e) => (!isJoined || waitlistPosition) && e.preventDefault()}
                    >
                      <MessageSquare className="w-4 h-4" /> COMMS
                    </Link>
                  </div>
                </div>

                {!isJoined && (
                  <p className="mt-6 text-[10px] text-center text-marble/25 micro-caps leading-relaxed">
                    By engaging this signal, you agree to Aura's discretion protocols and community guidelines.
                  </p>
                )}
              </div>

             <div className="glass-panel p-8 rounded-[32px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="micro-caps text-xs text-marble/50 tracking-[0.3em]">NETWORK PRESENCE</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gold/60">{participantCount}</span>
                    {waitlistTotal > 0 && (
                      <span className="text-[10px] bg-crimson/10 px-2 py-0.5 rounded text-crimson-bright">+{waitlistTotal}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {(moment.participant_count || 0) > 0 ? (
                    <div className="flex flex-col gap-4">
                       <div className="flex -space-x-3 mb-2">
                        {[...Array(Math.min(6, moment.participant_count || 0))].map((_, i) => (
                          <motion.img 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            src={`https://i.pravatar.cc/100?u=${moment.id}-p-${i}`}
                            className="w-10 h-10 rounded-full border-2 border-void ring-1 ring-white/10"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ))}
                        {(moment.participant_count || 0) > 6 && (
                          <div className="w-10 h-10 rounded-full bg-deep border-2 border-void flex items-center justify-center text-[10px] text-marble/40">
                             +{(moment.participant_count || 0) - 6}
                          </div>
                        )}
                       </div>
                       <p className="text-xs text-marble/40 leading-relaxed italic">
                         A diverse network of entities is currently converging at these coordinates.
                       </p>
                    </div>
                  ) : (
                    <div className="py-10 text-center flex flex-col items-center gap-3">
                       <Users className="w-8 h-8 text-marble/5" />
                       <p className="text-[10px] micro-caps text-marble/20">The void awaits your presence.</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── ADDITIONAL DETAILS ── */}
      <section className="px-6 md:px-12 py-20 bg-void/50 border-t border-white/5">
         <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="max-w-md">
                 <h4 className="font-serif text-3xl text-marble mb-4">The Aura Protocol</h4>
                 <p className="text-sm text-marble/50 leading-relaxed font-light">
                   Signals are ephemeral. They exist as long as the collective will of the participants sustains them. 
                   Ensure your presence is meaningful and respects the local coordinates.
                 </p>
               </div>
               <div className="flex gap-4">
                  <div className="glass-panel p-6 rounded-2xl min-w-[160px]">
                     <p className="micro-caps text-[9px] text-gold mb-2">ENTITY RATING</p>
                     <p className="text-2xl text-marble">PRIME</p>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl min-w-[160px]">
                     <p className="micro-caps text-[9px] text-crimson-bright mb-2">RISK LEVEL</p>
                     <p className="text-2xl text-marble">MINIMAL</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Decoration */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-gold/5 blur-[120px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[50vw] h-[50vh] bg-crimson/5 blur-[120px] pointer-events-none rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  )
}
