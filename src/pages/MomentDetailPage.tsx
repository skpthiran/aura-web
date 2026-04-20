import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Users, Clock, Share2, MessageSquare, ChevronLeft, Loader, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import { MomentDetailSkeleton } from '../components/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { getSignalImage } from '../lib/signalImage'

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
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-void">
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
    <div className="flex flex-col h-screen bg-obsidian overflow-hidden">
      {/* HERO */}
      <div className="relative w-full flex-shrink-0 overflow-hidden" style={{height: '45vh'}}>
        <img 
          src={getSignalImage(moment.id, moment.tags, moment.moment_type)} 
          className="absolute inset-0 w-full h-full object-cover object-center" 
          alt={moment.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button 
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center z-10"
        >
          {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5 text-white" />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-obsidian to-transparent">
          <div className="flex flex-wrap gap-2 mb-3">
             {moment.tags?.map((tag: string) => (
               <span key={tag} className="px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-bold uppercase tracking-wider text-gold-pale backdrop-blur-sm">
                 {tag}
               </span>
             ))}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
            {moment.title}
          </h1>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto px-6 pb-32">
        <div className="grid grid-cols-3 gap-3 mb-8 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Users className="w-5 h-5 text-gold mb-1.5" />
            <span className="text-white font-bold text-lg leading-none">{participantCount}</span>
            <span className="text-[10px] uppercase text-marble/40 tracking-widest mt-1">Going</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-5 h-5 text-gold mb-1.5" />
            <span className="text-white font-bold text-lg leading-none">{hoursLeft}h</span>
            <span className="text-[10px] uppercase text-marble/40 tracking-widest mt-1">Left</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <MapPin className="w-5 h-5 text-gold mb-1.5" />
            <span className="text-white font-bold text-lg leading-none truncate w-full">{distanceLabel}</span>
            <span className="text-[10px] uppercase text-marble/40 tracking-widest mt-1">Away</span>
          </div>
        </div>

        {creator && (
          <div className="flex items-center justify-between mb-8 p-3 rounded-2xl glass-panel border border-white/5 bg-deep/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`} 
                  className="w-12 h-12 rounded-full border-2 border-gold/20 object-cover"
                  alt={creator.username || ''}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">{creator.full_name || creator.username}</span>
                <span className="text-marble/40 text-[10px] uppercase">Host • {timeAgo}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/app/user/${creator.id}`)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-marble"
            >
              Profile
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gold rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gold-pale">The Vibe</h3>
          </div>
          <p className="text-marble/70 leading-relaxed text-sm whitespace-pre-wrap">
            {moment.description || "No description provided."}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
           <button 
             onClick={() => navigate(`/app/chat`)}
             className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
           >
             <MessageSquare className="w-5 h-5 text-gold" />
             Group Chat
           </button>
        </div>
      </div>

      {/* FIXED BOTTOM */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-8 bg-gradient-to-t from-obsidian via-obsidian/95 to-transparent">
        {joined ? (
          <button 
            onClick={handleLeave}
            disabled={joining}
            className="w-full h-16 rounded-2xl bg-white/10 border border-white/20 text-white font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl flex items-center justify-center"
          >
            {joining ? <Loader className="w-5 h-5 animate-spin" /> : "Leave Moment"}
          </button>
        ) : (
          <button 
            onClick={handleJoin}
            disabled={joining || (moment.capacity_limit > 0 && participantCount >= moment.capacity_limit)}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-gold to-gold/80 text-void font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(212,175,55,0.3)] flex items-center justify-center"
          >
            {joining ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              moment.capacity_limit > 0 && participantCount >= moment.capacity_limit ? "Waitlist Full" : "Join Moment"
            )}
          </button>
        )}
      </div>
    </div>
  )
}
