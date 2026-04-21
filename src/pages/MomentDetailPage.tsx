import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Users, Clock, MapPin, MessageSquare, ExternalLink, Loader, Share2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import { MomentDetailSkeleton } from '../components/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { getSignalImage } from '../lib/signalImage'
import { cn } from '../lib/utils'

export default function MomentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [moment, setMoment] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
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


  const fetchMoment = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*, creator:profiles(id, username, avatar_url)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      if (!data) return
      
      setMoment(data)
      if (data.creator) setCreator(data.creator)
    } catch (err) {
      // Error handled by state
    } finally {
      setLoading(false)
    }
  }



  const checkIfJoined = async () => {
    if (!user || !id) return
    const { data } = await supabase
      .from('participants')
      .select('id, status')
      .eq('moment_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (data?.status === 'joined') setJoined(true)
  }

  const handleJoin = async () => {
    if (!id || joined) return
    try {
      setJoining(true)
      await joinMoment(id)
      setJoined(true)
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!id || !joined) return
    try {
      setJoining(true)
      await leaveMoment(id)
      setJoined(false)
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
  if (!moment) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#08080f]">
       <h1 className="font-serif text-2xl text-marble/20">Signal Lost</h1>
       <button onClick={() => navigate(-1)} className="mt-4 text-gold text-sm underline">Go Back</button>
    </div>
  )

  const hoursLeft = moment.expires_at 
    ? Math.max(0, Math.floor((new Date(moment.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0

  const timeLeft = `${hoursLeft}h`
  const distanceLabel = moment.distance_meters 
    ? (moment.distance_meters > 1000 ? `${(moment.distance_meters / 1000).toFixed(1)}km` : `${Math.round(moment.distance_meters)}m`)
    : 'Nearby'
  const attendeeCount = moment?.participant_count ?? 0
  const isJoined = joined
  const heroImage = moment?.image_url || getSignalImage(moment.id, moment.tags, moment.moment_type)

  return (
    <div className="min-h-screen bg-[#08080f] lg:flex">

      {/* HERO */}
      <div
        className="relative w-full lg:w-[50%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden h-[40vh] lg:h-auto"
      >
        {heroImage ? (
          <img 
            src={heroImage} 
            className="absolute inset-0 w-full h-full object-cover object-center" 
            onError={(e) => { 
              e.currentTarget.src = `https://picsum.photos/seed/${moment.id}/1920/1200`
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a1f3d] via-[#1a1228] to-[#08080f]">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c9a84c 0%, transparent 60%)' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080f]/60 via-transparent to-transparent" />

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Badge */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-[#c9a84c]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#c9a84c]">Live Signal</span>
        </div>

        {/* Desktop title */}
        <div className="absolute bottom-0 left-0 right-0 p-8 hidden lg:block">
          <div className="flex flex-wrap gap-2 mb-4">
            {moment?.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 text-[9px] tracking-[0.15em] uppercase">#{tag}</span>
            ))}
          </div>
          <h1 className="text-white font-black uppercase leading-[0.95] drop-shadow-2xl"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '0.04em' }}>
            {moment?.title}
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col lg:h-screen lg:overflow-y-auto">
        <div className="flex-1 px-6 lg:px-10 pt-7 lg:pt-14 pb-36 lg:pb-10">

          {/* Mobile title */}
          <div className="lg:hidden mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {moment?.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/40 text-[9px] tracking-[0.15em] uppercase">#{tag}</span>
              ))}
            </div>
            <h1 className="text-white font-black uppercase text-3xl tracking-[0.03em] leading-tight">{moment?.title}</h1>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { Icon: Users, value: attendeeCount ?? 0, label: 'Attending' },
              { Icon: Clock, value: timeLeft, label: 'Remaining' },
              { Icon: MapPin, value: distanceLabel || 'Nearby', label: 'Distance' },
            ].map(({ Icon, value, label }) => (
              <div key={label}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center gap-2 hover:border-[#c9a84c]/20 hover:bg-white/[0.05] transition-all duration-300">
                <Icon className="w-4 h-4 text-[#c9a84c]/50" strokeWidth={1.5} />
                <p className="text-white font-bold text-[18px] leading-none">{value}</p>
                <p className="text-white/25 text-[8px] tracking-[0.2em] uppercase">{label}</p>
              </div>
            ))}
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-[#c9a84c]/25 to-transparent" />
            <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">Signal Details</span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#c9a84c]/25 to-transparent" />
          </div>

          {/* HOST */}
          {moment?.creator && (
            <div
              onClick={() => navigate(`/profile/${moment.creator_id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-6 cursor-pointer hover:border-[#c9a84c]/20 hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gradient-to-br from-[#c9a84c]/20 to-transparent flex items-center justify-center">
                {moment.creator.avatar_url
                  ? <img src={moment.creator.avatar_url} className="w-full h-full object-cover" />
                  : <span className="text-[15px] font-black text-[#c9a84c] uppercase">{moment.creator.username?.[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] tracking-[0.25em] uppercase text-white/25 mb-0.5">Organized by</p>
                <p className="text-white font-bold text-[13px] tracking-widest uppercase truncate">{moment.creator.username}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-[#c9a84c]/50 transition-colors flex-shrink-0" />
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="mb-6">
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#c9a84c]/40 mb-3 flex items-center gap-2">
              <span className="h-px w-5 bg-[#c9a84c]/30 inline-block" />
              The Mission
            </p>
            <p className="text-white/55 text-[14px] leading-[1.8] font-light">{moment?.description}</p>
          </div>

          {/* CHAT */}
          <button
            onClick={() => navigate(`/moment/${moment?.id}/chat`)}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.06] text-white/35 text-[10px] tracking-[0.2em] uppercase hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-white/55 transition-all duration-300 group"
          >
            <MessageSquare className="w-4 h-4 group-hover:text-[#c9a84c]/60 transition-colors" />
            Open Signal Chat
          </button>

        </div>

        {/* BOTTOM ACTION */}
        <div className="fixed lg:sticky bottom-0 left-0 right-0 px-6 lg:px-10 pb-8 pt-5 bg-gradient-to-t from-[#08080f] via-[#08080f]/95 to-transparent">
          {isJoined ? (
            <button onClick={handleLeave}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/[0.03] text-white/35 text-[11px] font-bold tracking-[0.22em] uppercase hover:border-red-500/20 hover:text-red-400/40 transition-all duration-300">
              ✓ Joined · Tap to Leave
            </button>
          ) : (
            <button onClick={handleJoin}
              className="w-full py-4 rounded-2xl text-[#08080f] text-[12px] font-black tracking-[0.22em] uppercase transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-[#c9a84c]/20"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #dfc070 50%, #c9a84c 100%)' }}>
              Join Moment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

