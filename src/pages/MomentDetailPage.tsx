import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  ArrowLeft, MapPin, Clock, Users, Calendar,
  Zap, Tag, MessageSquare, Share2, Loader,
  Check, Lock
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
  const [joined, setJoined] = useState(false)
  const [copied, setCopied] = useState(false)
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
      const result = await joinMoment(id)
      if (result.status === 'joined') {
        setJoined(true)
        setParticipantCount(prev => prev + 1)
      } else {
        setWaitlistPosition(result.position ?? null)
      }
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-void">
        <Loader className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  if (!moment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center
        bg-void gap-4 text-center px-6">
        <Zap className="w-8 h-8 text-marble/20" />
        <p className="font-serif text-2xl text-marble/40">Signal not found</p>
        <button onClick={() => navigate(-1)}
          className="micro-caps text-sm px-6 py-3 rounded-full
            border border-white/20 text-marble/50 hover:text-marble transition-all">
          Go Back
        </button>
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
      <div className="relative" style={{ height: '45vh', minHeight: '280px', maxHeight: '380px' }}>
        <img
          src={`https://picsum.photos/seed/${moment.id}/1200/600`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(10,10,15,1) 100%)' }}
        />

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md
              border border-white/15 flex items-center justify-center
              text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md
              border border-white/15 flex items-center justify-center
              text-white/70 hover:text-white transition-colors">
            {copied
              ? <Check className="w-4 h-4 text-green-400" />
              : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom of hero — type + status */}
        <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center gap-2">
          <span className={cn(
            'micro-caps text-xs px-3 py-1.5 rounded-full border backdrop-blur-md',
            isEvent
              ? 'bg-gold/20 border-gold/50 text-gold'
              : 'bg-red-900/30 border-red-500/50 text-red-400'
          )}>
            {isEvent ? '◈ Event' : '⚡ Moment'}
          </span>
          {isPrivate && (
            <span className="micro-caps text-xs px-3 py-1.5 rounded-full
              bg-black/40 border border-white/20 text-white/50 backdrop-blur-md
              flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
          {isExpired && (
            <span className="micro-caps text-xs px-3 py-1.5 rounded-full
              bg-black/40 border border-white/15 text-white/30 backdrop-blur-md">
              Expired
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-lg mx-auto px-5 -mt-2 pb-24">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl md:text-4xl text-marble leading-tight mb-2 mt-4"
        >
          {moment.title}
        </motion.h1>

        {/* Creator row */}
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
            className="text-marble/55 text-sm leading-relaxed mb-6"
          >
            {moment.description}
          </motion.p>
        )}

        {/* KEY INFO CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-2.5 mb-6"
        >
          {/* Capacity */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gold" />
              <p className="micro-caps text-xs text-marble/40">Capacity</p>
            </div>
            <p className="font-serif text-2xl text-marble mb-2">
              {participantCount}<span className="text-marble/30 text-lg">/{moment.capacity_limit}</span>
            </p>
            <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
              <div className={cn(
                'h-full rounded-full transition-all duration-500',
                isFull ? 'bg-red-500' : capacityPct > 80 ? 'bg-gold' : 'bg-green-500'
              )} style={{ width: `${capacityPct}%` }} />
            </div>
            {waitlistTotal > 0 && (
              <p className="micro-caps text-xs text-gold/50 mt-2">+{waitlistTotal} waitlist</p>
            )}
          </div>

          {/* Time */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gold" />
              <p className="micro-caps text-xs text-marble/40">
                {isExpired ? 'Ended' : 'Status'}
              </p>
            </div>
            {isExpired ? (
              <p className="font-serif text-xl text-marble/30">Expired</p>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="micro-caps text-xs text-green-400">Live</p>
                </div>
                <p className="font-serif text-2xl text-marble">{moment.expires_at ? hoursLeft : '∞'}h</p>
                <p className="micro-caps text-xs text-marble/30">remaining</p>
              </>
            )}
          </div>
        </motion.div>

        {/* TIMING DETAILS */}
        {(startTime || endTime || venue) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden mb-6"
          >
            {startTime && (
              <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/6">
                <Calendar className="w-4 h-4 text-gold shrink-0" />
                <div>
                  <p className="micro-caps text-xs text-marble/30 mb-0.5">
                    {isEvent ? 'Starts' : 'From'}
                  </p>
                  <p className="text-marble text-sm">{formatDateTime(startTime)}</p>
                </div>
              </div>
            )}
            {endTime && (
              <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/6">
                <Clock className="w-4 h-4 text-marble/30 shrink-0" />
                <div>
                  <p className="micro-caps text-xs text-marble/30 mb-0.5">Ends</p>
                  <p className="text-marble text-sm">{formatDateTime(endTime)}</p>
                </div>
                {formatDuration() && (
                  <span className="ml-auto micro-caps text-xs text-gold/60 bg-gold/8
                    border border-gold/20 rounded-full px-2.5 py-1">
                    {formatDuration()}
                  </span>
                )}
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-4 px-4 py-3.5">
                <MapPin className="w-4 h-4 text-marble/30 shrink-0" />
                <div>
                  <p className="micro-caps text-xs text-marble/30 mb-0.5">Venue</p>
                  <p className="text-marble text-sm">{venue}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* EVENT DETAILS — dress code + age */}
        {(dresscode || ageMin) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="grid grid-cols-2 gap-2.5 mb-6"
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

        {/* TAGS */}
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
                #{tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* ACTIONS */}
        {!isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            {/* Join / Waitlist */}
            {waitlistPosition ? (
              <div className="w-full py-4 rounded-2xl text-center
                bg-gold/8 border border-gold/25">
                <p className="micro-caps text-sm text-gold font-medium">
                  ◈ On Waitlist — Position #{waitlistPosition}
                </p>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joined || joining || !user}
                className={cn(
                  'w-full py-4 rounded-2xl micro-caps text-sm font-medium',
                  'transition-all duration-300',
                  joined
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                    : isFull
                      ? 'bg-white/6 text-marble/60 border border-white/12 hover:bg-white/10'
                      : 'bg-marble text-void hover:bg-green-400 hover:shadow-xl hover:shadow-green-400/20'
                )}
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    {isFull ? 'Joining waitlist...' : 'Joining...'}
                  </span>
                ) : joined ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Joined
                  </span>
                ) : isFull ? 'Join Waitlist' : 'Join Signal'}
              </button>
            )}

            {/* Open chat if joined */}
            {joined && (
              <Link to="/app/chat" className="w-full">
                <button className="w-full py-3.5 rounded-2xl micro-caps text-sm
                  bg-white/5 border border-white/10 text-marble/60
                  hover:text-marble hover:bg-white/8 transition-all
                  flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Open Signal Chat
                </button>
              </Link>
            )}

            {/* View on map */}
            <Link to="/app/map">
              <button className="w-full py-3 micro-caps text-xs text-marble/25
                hover:text-marble/50 transition-colors
                flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                View on Map
              </button>
            </Link>
          </motion.div>
        )}

        {/* Expired state actions */}
        {isExpired && (
          <div className="flex gap-3 mt-2">
            <button onClick={() => navigate(-1)}
              className="flex-1 py-3.5 rounded-2xl micro-caps text-sm
                bg-white/5 border border-white/10 text-marble/50
                hover:text-marble transition-all">
              Go Back
            </button>
            <Link to="/app/today" className="flex-1">
              <button className="w-full py-3.5 rounded-2xl micro-caps text-sm
                bg-marble text-void hover:bg-gold transition-all">
                Discover Signals
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
