import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  ArrowLeft, MapPin, Clock, Users, Calendar,
  Zap, Tag, MessageSquare, Share2, Loader,
  Check, Lock, Flag
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'
import { getSignalImage } from '../lib/signalImage'
import { MomentDetailSkeleton } from '../components/Skeleton'
import { Radio } from 'lucide-react'

const ReportModal = lazy(() => import('../components/ReportModal'))

export default function MomentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [moment, setMoment] = useState<Moment | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)
  const [waitlistTotal, setWaitlistTotal] = useState(0)
  const [isFull, setIsFull] = useState(false)
  const [creator, setCreator] = useState<{
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  } | null>(null)

  usePageTitle(moment?.title ?? 'Signal')

  useEffect(() => {
    if (!id) return
    fetchMoment()
    checkIfJoined()
  }, [id, user])

  // Realtime participant count
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`participants:${id}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `moment_id=eq.${id}`,
      }, (payload) => {
        const p = payload.new as any
        if (p.status === 'joined') setParticipantCount(prev => prev + 1)
        if (p.status === 'waitlist') setWaitlistTotal(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const fetchMoment = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('moments')
        .select('*')
        .eq('id', id)
        .single()
      if (!data) return
      setMoment(data as Moment)

      const { count: joinedCount } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('moment_id', id)
        .eq('status', 'joined')
      setParticipantCount(joinedCount ?? 0)
      setIsFull((joinedCount ?? 0) >= (data.capacity_limit ?? 999))

      const { count: wCount } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('moment_id', id)
        .eq('status', 'waitlist')
      setWaitlistTotal(wCount ?? 0)

      if (data.creator_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', data.creator_id)
          .single()
        if (creatorData) setCreator(creatorData)
      }
    } finally {
      setLoading(false)
    }
  }

  const checkIfJoined = async () => {
    if (!user || !id) return
    const { data } = await supabase
      .from('participants')
      .select('id, status, position')
      .eq('moment_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (data?.status === 'joined') setJoined(true)
    if (data?.status === 'waitlist') setWaitlistPosition(data.position ?? null)
  }

  const handleJoin = async () => {
    if (!user || joined || waitlistPosition || !id) return
    setJoining(true)
    try {
      await joinMoment(id)
      setJoined(true)
      setParticipantCount(prev => prev + 1)
    } catch (err: any) {
      console.error('Join failed:', err)
      alert(err.message ?? 'Failed to join signal')
    } finally {
      setJoining(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: moment?.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  if (loading) return <MomentDetailSkeleton />
  
  if (!moment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-void">
         <Radio className="w-16 h-16 text-marble/5 mb-8" />
         <h1 className="font-serif text-3xl text-marble/20">Signal Lost in Transmission</h1>
         <Link to="/app/today" className="mt-8">
            <button className="micro-caps px-8 py-3 glass-panel hairline-all rounded-full text-marble/50 hover:text-marble transition-all">
              Return to Pulse
            </button>
         </Link>
      </div>
    )
  }

  const isEvent = moment.moment_type === 'event'
  const isExpired = new Date(moment.expires_at) < new Date()
  const hoursLeft = Math.max(0, Math.round(
    (new Date(moment.expires_at).getTime() - Date.now()) / 3600000
  ))
  const capacityPct = Math.min(100, (participantCount / (moment.capacity_limit || 1)) * 100)

  const startTime = (moment as any).start_time
  const endTime = (moment as any).end_time
  const venue = (moment as any).venue
  const dresscode = (moment as any).dresscode
  const ageMin = (moment as any).age_min
  const ageMax = (moment as any).age_max
  const isPrivate = (moment as any).is_private

  const formatDuration = () => {
    if (!startTime || !endTime) return null
    const diff = new Date(endTime).getTime() - new Date(startTime).getTime()
    if (diff <= 0) return null
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`
  }

  const formatDateTime = (dt: string) =>
    new Date(dt).toLocaleDateString('en', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  return (
    <div className="flex-1 overflow-y-auto bg-void">

      {/* HERO */}
      <div className="relative w-full overflow-hidden" style={{ height: '55vw', maxHeight: '380px', minHeight: '220px' }}>
        <motion.img
          initial={{ scale: 1.15, filter: 'blur(10px)', opacity: 0 }}
          animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          src={getSignalImage(moment.id, moment.tags, moment.moment_type)}
          className="w-full h-full object-cover object-center block"
          style={{ display: 'block' }}
          onError={(e) => { 
            e.currentTarget.src = `https://picsum.photos/seed/${moment.id}/1200/600`
          }}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 70%, #000 100%)',
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
          }}
        />

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 px-5 pt-6">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[#0a0a14]/85 backdrop-blur-md
              border border-white/20 flex items-center justify-center
              text-white/70 hover:text-white transition-all shadow-2xl"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-2">
            {/* Report — only show if not creator */}
            {user && moment && user.id !== (moment as any).creator_id && (
              <button
                onClick={() => setShowReport(true)}
                className="w-10 h-10 rounded-xl bg-[#0a0a14]/85 backdrop-blur-md
                  border border-white/20 flex items-center justify-center
                  text-white/50 hover:text-red-400 transition-all shadow-2xl"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}>
                <Flag className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            {/* Share */}
            <button onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-[#0a0a14]/85 backdrop-blur-md
                border border-white/20 flex items-center justify-center
                text-white/70 hover:text-white transition-all shadow-2xl"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}>
              {copied
                ? <Check className="w-5 h-5 text-green-400" />
                : <Share2 className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Bottom of hero — type + status */}
        <div className="absolute bottom-10 left-5 right-5 z-20 flex items-center gap-2">
          <span className={cn(
            'micro-caps text-[10px] tracking-[0.2em] px-4 py-2 rounded-xl border backdrop-blur-md shadow-xl',
            isEvent
              ? 'bg-[#0a0a14]/85 border-gold/40 text-gold'
              : 'bg-[#0a0a14]/85 border-crimson/40 text-crimson-bright'
          )} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            {isEvent ? '◈ Event' : '⚡ Moment'}
          </span>
          {isPrivate && (
            <span className="micro-caps text-[10px] tracking-[0.2em] px-4 py-2 rounded-xl
              bg-[#0a0a14]/85 border border-white/20 text-white/50 backdrop-blur-md
              flex items-center gap-2 shadow-xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
          {isExpired && (
            <span className="micro-caps text-[10px] tracking-[0.2em] px-4 py-2 rounded-xl
              bg-[#0a0a14]/85 border border-white/20 text-white/30 backdrop-blur-md shadow-xl"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Expired
            </span>
          )}
        </div>
      </div>

      {/* CONTENT — two column on desktop */}
      <div className="max-w-5xl mx-auto px-0 lg:px-8 pb-12">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:mt-8 px-5 lg:px-0">
          
          {/* LEFT COLUMN — main info */}
          <div>
            {/* Type badge — desktop shows above title */}
            <div className="hidden lg:flex items-center gap-2 mb-4">
              <span className={cn(
                'micro-caps text-xs px-3 py-1.5 rounded-full border',
                isEvent
                  ? 'bg-gold/15 border-gold/40 text-gold'
                  : 'bg-red-900/20 border-red-500/40 text-red-400'
              )}>
                {isEvent ? '◈ Event' : '⚡ Moment'}
              </span>
              {isPrivate && (
                <span className="micro-caps text-xs px-3 py-1.5 rounded-full
                  bg-white/5 border border-white/15 text-white/40
                  flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Private
                </span>
              )}
              {isExpired && (
                <span className="micro-caps text-xs px-3 py-1.5 rounded-full
                  bg-white/5 border border-white/10 text-white/25">
                  Expired
                </span>
              )}
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-4xl md:text-5xl lg:text-7xl text-marble 
                leading-[1.1] mb-5 mt-4 lg:mt-0 tracking-tight"
            >
              {moment.title}
            </motion.h1>

            {/* Creator */}
            {creator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-5"
              >
                <Link to={`/app/user/${creator.id}`}>
                  <div className="flex items-center gap-2.5 group w-fit">
                    <div className="w-7 h-7 rounded-full bg-marble/10
                      border border-white/15 overflow-hidden flex items-center justify-center">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display='none' }} />
                      ) : (
                        <span className="font-serif text-xs text-marble/50">
                          {(creator.full_name ?? 'A')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-marble/50 group-hover:text-marble transition-colors">
                      {creator.full_name ?? 'Anonymous'}
                      {creator.username && (
                        <span className="text-marble/30 ml-1">@{creator.username}</span>
                      )}
                    </span>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Description */}
            {moment.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-marble/55 text-base leading-relaxed mb-8 
                  max-w-prose"
              >
                {moment.description}
              </motion.p>
            )}

            {/* TIMING DETAILS — desktop left col */}
            {(startTime || endTime || venue) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel hairline-all rounded-3xl 
                  overflow-hidden mb-8 shadow-2xl"
              >
                {startTime && (
                  <div className="flex items-center gap-5 px-6 py-5 border-b border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                      <Calendar className="w-5 h-5 text-gold shrink-0" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="micro-caps text-[9px] text-marble/30 mb-0.5 tracking-widest">
                        {isEvent ? 'Commencing' : 'Available From'}
                      </p>
                      <p className="text-marble text-[15px] font-medium tracking-wide">
                        {formatDateTime(startTime)}
                      </p>
                    </div>
                  </div>
                )}
                {endTime && (
                  <div className="flex items-center gap-5 px-6 py-5 border-b border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock className="w-5 h-5 text-marble/30 shrink-0" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="micro-caps text-[9px] text-marble/30 mb-0.5 tracking-widest">Expires</p>
                      <p className="text-marble text-[15px] font-medium tracking-wide">
                        {formatDateTime(endTime)}
                      </p>
                    </div>
                    {formatDuration() && (
                      <span className="ml-auto micro-caps text-[9px] text-gold/80 
                        bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 tracking-[0.2em] font-bold">
                        {formatDuration()}
                      </span>
                    )}
                  </div>
                )}
                {venue && (
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <MapPin className="w-5 h-5 text-marble/30 shrink-0" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="micro-caps text-[9px] text-marble/30 mb-0.5 tracking-widest">Location</p>
                      <p className="text-marble text-[15px] font-medium tracking-wide">{venue}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Event details */}
            {(dresscode || ageMin) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {dresscode && (
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                    <p className="micro-caps text-xs text-marble/30 mb-1.5">Dress Code</p>
                    <p className="text-marble text-sm font-medium">{dresscode}</p>
                  </div>
                )}
                {ageMin && (
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                    <p className="micro-caps text-xs text-marble/30 mb-1.5">Age Range</p>
                    <p className="text-marble text-sm font-medium">
                      {ageMin}+{ageMax ? ` – ${ageMax}` : ''}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tags */}
            {moment.tags && moment.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {moment.tags.map(tag => (
                  <span key={tag}
                    className="micro-caps text-xs px-3 py-1.5 rounded-full
                      bg-white/5 border border-white/10 text-marble/50">
                    {'#'}{tag}
                  </span>
                ))}
              </motion.div>
            )}

              {/* Mobile actions — handled by sticky bottom bar */}
            </div>

          {/* RIGHT COLUMN — desktop sidebar panel */}
          <div className="hidden lg:block">
            <div className="sticky top-8 flex flex-col gap-4">

              {/* Capacity card */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" />
                    <p className="micro-caps text-xs text-marble/50">Capacity</p>
                  </div>
                  <span className="micro-caps text-xs text-marble/30">
                    {participantCount}/{moment.capacity_limit}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-3">
                  <div className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isFull ? 'bg-red-500' : capacityPct > 80 ? 'bg-gold' : 'bg-green-500'
                  )} style={{ width: `${capacityPct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      isExpired ? 'bg-marble/20' : 'bg-green-400 animate-pulse'
                    )} />
                    <span className="micro-caps text-xs text-marble/40">
                      {isExpired ? 'Ended' : isFull ? 'Full' : 'Open'}
                    </span>
                  </div>
                  {waitlistTotal > 0 && (
                    <span className="micro-caps text-xs text-gold/50">
                      +{waitlistTotal} waitlist
                    </span>
                  )}
                </div>
              </div>

              {/* Status card */}
              {!isExpired && (
                <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gold" />
                    <p className="micro-caps text-xs text-marble/50">Time Remaining</p>
                  </div>
                  <p className="font-serif text-4xl text-marble mb-1">{hoursLeft}h</p>
                  <p className="micro-caps text-xs text-marble/30">until signal expires</p>
                </div>
              )}

              {/* Join button — desktop */}
              {!isExpired && (
                <div className="flex flex-col gap-3">
                  {waitlistPosition ? (
                    <div className="w-full py-4 rounded-2xl text-center
                      bg-gold/8 border border-gold/25">
                      <p className="micro-caps text-sm text-gold font-medium">
                        ◈ On Waitlist - {'#'}{waitlistPosition}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joined || joining || !user}
                      className={cn(
                        'w-full py-4 rounded-2xl micro-caps text-sm font-medium transition-all',
                        joined
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                          : isFull
                            ? 'bg-white/6 text-marble/60 border border-white/12 hover:bg-white/10'
                            : 'bg-marble text-void hover:bg-green-400 hover:shadow-2xl hover:shadow-green-400/20'
                      )}
                    >
                      {joining ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Joining...
                        </span>
                      ) : joined ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Joined
                        </span>
                      ) : isFull ? 'Join Waitlist' : 'Join Signal'}
                    </button>
                  )}

                  {joined && (
                    <Link to="/app/chat">
                      <button className="w-full py-3.5 rounded-2xl micro-caps text-sm
                        bg-white/5 border border-white/10 text-marble/60
                        hover:text-marble transition-all flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Open Signal Chat
                      </button>
                    </Link>
                  )}

                  <Link to="/app/map">
                    <button className="w-full py-3 micro-caps text-xs text-marble/25
                      hover:text-marble/50 transition-colors
                      flex items-center justify-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      View on Map
                    </button>
                  </Link>
                </div>
              )}

              {isExpired && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => navigate(-1)}
                    className="w-full py-3.5 rounded-2xl micro-caps text-sm
                      bg-white/5 border border-white/10 text-marble/50
                      hover:text-marble transition-all">
                    Go Back
                  </button>
                  <Link to="/app/today">
                    <button className="w-full py-3.5 rounded-2xl micro-caps text-sm
                      bg-marble text-void hover:bg-gold transition-all">
                      Discover Signals
                    </button>
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* STICKY BOTTOM BAR - Mobile only */}
      <div className="lg:hidden fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-5 right-5 z-40">
        {!isExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', damping: 20 }}
            className="flex flex-col gap-3"
          >
            {joined && (
              <Link to="/app/chat" className="w-full">
                <button 
                  className="w-full py-4.5 rounded-2xl micro-caps text-[10px] tracking-[0.25em] font-bold
                    bg-[#0a0a14]/90 backdrop-blur-2xl border border-white/20 text-marble
                    shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-gold" strokeWidth={2} />
                  Open Signal Chat
                </button>
              </Link>
            )}
            
            {waitlistPosition ? (
              <div 
                className="w-full py-5 rounded-2xl text-center
                  bg-gold backdrop-blur-md border border-white/20 shadow-[0_10px_40px_rgba(212,175,55,0.2)]"
              >
                <p className="micro-caps text-[11px] text-void font-black tracking-[0.3em]">
                  ◈ Waiting Pool: {'#'}{waitlistPosition}
                </p>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joined || joining || !user}
                className={cn(
                  'w-full py-5 rounded-2xl micro-caps text-[11px] tracking-[0.3em] font-black transition-all shadow-[0_10px_50px_rgba(0,0,0,0.6)]',
                  joined
                    ? 'bg-emerald-500 text-void border border-emerald-400'
                    : isFull
                      ? 'bg-gold text-void border border-white/20 shadow-[0_10px_40px_rgba(212,175,55,0.3)]'
                      : 'bg-marble text-void active:scale-95'
                )}
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader className="w-5 h-5 animate-spin" strokeWidth={3} />
                    {isFull ? 'Queuing...' : 'Syncing...'}
                  </span>
                ) : joined ? (
                  <span className="flex items-center justify-center gap-3">
                    <Check className="w-5 h-5" strokeWidth={3} /> Access Granted
                  </span>
                ) : isFull ? 'Join Waiting Pool' : 'Join Signal'}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex gap-3">
             <button onClick={() => navigate(-1)}
              className="flex-1 py-5 rounded-2xl micro-caps text-[10px] font-bold tracking-[0.2em]
                bg-[#0a0a14]/90 backdrop-blur-xl border border-white/10 text-marble shadow-2xl">
              Back
            </button>
            <Link to="/app/today" className="flex-1">
              <button className="w-full py-5 rounded-2xl micro-caps text-[10px] font-black tracking-[0.2em]
                bg-marble text-void shadow-2xl">
                Discover
              </button>
            </Link>
          </div>
        )}
      </div>

      {showReport && moment && (
        <Suspense fallback={null}>
          <ReportModal
            momentId={moment.id}
            momentTitle={moment.title}
            onClose={() => setShowReport(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
