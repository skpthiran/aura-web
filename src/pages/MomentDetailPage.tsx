import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Users, Clock, Share2, MessageSquare, ChevronLeft, Loader, Check, ExternalLink } from 'lucide-react'
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
  const [participantCount, setParticipantCount] = useState(0)
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
      const { data } = await supabase
        .from('moments')
        .select('*')
        .eq('id', id)
        .single()
      if (!data) return
      setMoment(data)

      const { count: joinedCount } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('moment_id', id)
        .eq('status', 'joined')
      setParticipantCount(joinedCount ?? 0)

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
      setParticipantCount(prev => prev + 1)
    } catch (error) {
      console.error('Error joining:', error)
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
      setParticipantCount(prev => prev - 1)
    } catch (error) {
      console.error('Error leaving:', error)
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

  const timeAgo = moment.created_at ? formatDistanceToNow(new Date(moment.created_at)) + ' ago' : ''
  const distanceLabel = moment.distance_meters 
    ? (moment.distance_meters > 1000 ? `${(moment.distance_meters / 1000).toFixed(1)}km` : `${Math.round(moment.distance_meters)}m`)
    : 'Nearby'

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col lg:flex-row overflow-x-hidden">
      
      {/* ── LEFT / TOP — HERO IMAGE ── */}
      <div className="relative w-full lg:w-[52%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden">
        <img 
          src={getSignalImage(moment.id, moment.tags, moment.moment_type)} 
          className="absolute inset-0 w-full h-full object-cover object-center" 
          alt={moment.title}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-black/30 lg:bg-gradient-to-r lg:from-transparent lg:to-[#08080f]/40" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

        {/* Floating Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-transform active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-transform active:scale-95"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Mobile Title Overlay (only visible on mobile) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-[#08080f] to-transparent lg:hidden">
          <div className="flex flex-wrap gap-2 mb-3">
             {moment.tags?.map((tag: string) => (
               <span key={tag} className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black uppercase tracking-widest text-gold-pale backdrop-blur-sm">
                 {tag}
               </span>
             ))}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight text-shadow-glow">
            {moment.title}
          </h1>
        </div>

        {/* Mobile height constraint */}
        <div className="h-[50vh] lg:hidden" />
      </div>

      {/* ── RIGHT — CONTENT PANEL ── */}
      <div className="flex-1 w-full bg-[#08080f] relative z-10 lg:min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-8 lg:px-12 lg:py-16 pb-40">
          
          {/* Desktop Header */}
          <div className="hidden lg:block mb-10">
            <div className="flex flex-wrap gap-2 mb-4">
               {moment.tags?.map((tag: string) => (
                 <span key={tag} className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-black uppercase tracking-widest text-gold-pale">
                   {tag}
                 </span>
               ))}
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-[1.1] mb-4">
              {moment.title}
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-colors">
              <Users className="w-5 h-5 text-gold mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white font-black text-xl leading-none">{participantCount}</span>
              <span className="text-[10px] uppercase text-marble/30 font-bold tracking-widest mt-2 uppercase">Attending</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-colors">
              <Clock className="w-5 h-5 text-gold mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white font-black text-xl leading-none">{hoursLeft}h</span>
              <span className="text-[10px] uppercase text-marble/30 font-bold tracking-widest mt-2 uppercase">Time Left</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-colors overflow-hidden">
              <MapPin className="w-5 h-5 text-gold mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white font-black text-lg leading-none truncate w-full">{distanceLabel}</span>
              <span className="text-[10px] uppercase text-marble/30 font-bold tracking-widest mt-2 uppercase">Distance</span>
            </div>
          </div>

          {/* Host Info */}
          {creator && (
            <div className="flex items-center justify-between mb-12 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`} 
                    className="w-14 h-14 rounded-full border-2 border-gold/30 object-cover shadow-2xl"
                    alt={creator.username || ''}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center border-2 border-[#08080f]">
                    <Check className="w-3 h-3 text-void" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-marble/40 text-[10px] font-black uppercase tracking-widest mb-0.5">Organized by</span>
                  <span className="text-white font-black text-base">{creator.full_name || creator.username}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/app/user/${creator.id}`)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-marble hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-6 bg-gold/50" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold-pale">The Mission</h3>
            </div>
            <p className="text-marble/70 leading-relaxed text-lg font-medium whitespace-pre-wrap">
              {moment.description || "Entering unchartered territories. No mission brief provided."}
            </p>
          </div>

          {/* Social / Chat Hook */}
          <button 
            onClick={() => navigate(`/app/chat`)}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <MessageSquare className="w-5 h-5 text-gold" />
            Join the Vibe
          </button>
        </div>
      </div>

      {/* ── FIXED ACTION BAR (Mobile & Desktop Floating) ── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:w-[48%] px-6 pb-8 pt-10 z-50 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          {joined ? (
            <button 
              onClick={handleLeave}
              disabled={joining}
              className="w-full h-18 py-5 rounded-2xl bg-white/10 border border-white/20 text-white font-black uppercase tracking-[0.25em] shadow-2xl backdrop-blur-2xl flex items-center justify-center hover:bg-white/15 transition-all group"
            >
              {joining ? <Loader className="w-6 h-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Leave Moment
                </span>
              )}
            </button>
          ) : (
            <button 
              onClick={handleJoin}
              disabled={joining || (moment.capacity_limit > 0 && participantCount >= moment.capacity_limit)}
              className="w-full h-18 py-5 rounded-2xl bg-gradient-to-r from-gold to-[#b8860b] text-void font-black uppercase tracking-[0.25em] shadow-[0_20px_50px_rgba(212,175,55,0.3)] flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all"
            >
              {joining ? (
                <Loader className="w-6 h-6 animate-spin" />
              ) : (
                moment.capacity_limit > 0 && participantCount >= moment.capacity_limit ? "Waitlist Full" : "Join the Movement"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
