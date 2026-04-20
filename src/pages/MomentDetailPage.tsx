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
      
      console.log('Fetched moment data:', data)
      console.log('image_url field specifically:', data?.image_url)
      
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

  const timeLeft = `${hoursLeft}h`
  const timeAgo = moment.created_at ? formatDistanceToNow(new Date(moment.created_at)) + ' ago' : ''
  const distanceLabel = moment.distance_meters 
    ? (moment.distance_meters > 1000 ? `${(moment.distance_meters / 1000).toFixed(1)}km` : `${Math.round(moment.distance_meters)}m`)
    : 'Nearby'
  const isJoined = joined

  // Fallback image logic
  const displayImage = moment.image_url || getSignalImage(moment.id, moment.tags, moment.moment_type)

  return (
    <div className="min-h-screen bg-[#08080f] lg:flex lg:flex-row overflow-x-hidden">
      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <div className="relative w-full lg:w-[55%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden bg-obsidian">
        {displayImage ? (
          <img 
            src={displayImage} 
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105" 
            alt={moment.title}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-deep via-obsidian to-black" />
        )}
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080f]/40 via-transparent to-transparent lg:hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#08080f_100%)] opacity-40" />

        {/* Top Actions */}
        <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:border-gold/40 hover:bg-black/60 transition-all duration-500"
          >
            <ChevronLeft className="w-4 h-4 text-white group-hover:text-gold transition-colors" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/80 group-hover:text-white">Back</span>
          </button>

          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-gold/40 transition-all duration-300"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-white" />}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-gold/20">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-gold">Active Signal</span>
            </div>
          </div>
        </div>

        {/* Desktop Title Overlay */}
        <div className="absolute bottom-12 left-12 right-12 z-20 hidden lg:block">
          <div className="flex flex-wrap gap-2 mb-6">
            {moment?.tags?.map((tag: string) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-gold/10 backdrop-blur-md border border-gold/20 text-gold-pale text-[9px] tracking-[0.2em] uppercase">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-white font-black uppercase text-6xl leading-[0.9] tracking-tighter mb-4 drop-shadow-2xl">
            {moment.title}
          </h1>
          <div className="flex items-center gap-6 text-white/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold/60" />
              <span className="text-xs font-bold tracking-[0.1em]">{participantCount} Participating</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold/60" />
              <span className="text-xs font-bold tracking-[0.1em]">{timeLeft} Remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CONTENT SECTION
      ═══════════════════════════════════════ */}
      <div className="relative flex-1 flex flex-col bg-[#08080f] lg:border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex-1 px-6 lg:px-16 pt-10 lg:pt-24 pb-48">
          
          {/* Mobile Title */}
          <div className="lg:hidden mb-10">
             <div className="flex flex-wrap gap-2 mb-4">
              {moment?.tags?.map((tag: string) => (
                <span key={tag} className="text-gold/60 text-[9px] tracking-[0.2em] uppercase">#{tag}</span>
              ))}
            </div>
            <h1 className="text-white font-black uppercase text-4xl leading-none tracking-tight mb-4">{moment.title}</h1>
            <div className="h-px w-20 bg-gold/30" />
          </div>

          {/* Stats Grid - Luxury Style */}
          <div className="grid grid-cols-2 gap-4 mb-12 lg:hidden">
             <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <p className="text-white/30 text-[8px] tracking-[0.2em] uppercase mb-1">Impact</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-white font-black text-xl">{participantCount}</span>
                   <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Active</span>
                </div>
             </div>
             <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <p className="text-white/30 text-[8px] tracking-[0.2em] uppercase mb-1">Time Window</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-white font-black text-xl">{timeLeft}</span>
                   <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Left</span>
                </div>
             </div>
          </div>

          {/* Location / Mission Brief */}
          <div className="space-y-12 max-w-xl">
            <section>
              <h3 className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                <span className="w-6 h-px bg-gold/30" />
                The Briefing
              </h3>
              <p className="text-white/60 text-lg leading-relaxed font-light font-serif italic">
                "{moment.description || "Entering unchartered territories. No mission brief provided."}"
              </p>
            </section>

            <section>
              <h3 className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                <span className="w-6 h-px bg-gold/30" />
                Intelligence
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gold/5 border border-gold/10 flex items-center justify-center">
                         <MapPin className="w-4 h-4 text-gold/60" />
                      </div>
                      <div>
                         <p className="text-white/30 text-[8px] tracking-[0.2em] uppercase">Sector</p>
                         <p className="text-white font-bold tracking-widest uppercase text-xs">{distanceLabel}</p>
                      </div>
                   </div>
                   <ExternalLink className="w-4 h-4 text-white/10 group-hover:text-gold transition-colors" />
                </div>

                {creator && (
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer"
                       onClick={() => navigate(`/app/user/${creator.id}`)}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5">
                          {creator.avatar_url 
                            ? <img src={creator.avatar_url} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center text-xs font-black text-gold/40">{(creator.username || '?')[0].toUpperCase()}</div>
                          }
                        </div>
                        <div>
                          <p className="text-white/30 text-[8px] tracking-[0.2em] uppercase">Superordinated by</p>
                          <p className="text-white font-bold tracking-widest uppercase text-xs">{creator.username}</p>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
               <button 
                onClick={() => navigate('/app/chat')}
                className="w-full group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 p-6 hover:border-gold/20 transition-all duration-500"
               >
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-4 h-4 text-gold" />
                       </div>
                       <div className="text-left">
                          <p className="text-white font-bold tracking-widest uppercase text-xs">Signal Frequency</p>
                          <p className="text-white/30 text-[9px] tracking-widest uppercase">Open secure channel</p>
                       </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-gold/10 group-hover:border-gold/20">
                       <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-gold" />
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
               </button>
            </section>
          </div>
        </div>

        {/* ── STICKY FOOTER ACTION ── */}
        <div className="fixed lg:absolute bottom-0 left-0 right-0 p-6 lg:p-12 z-50 bg-gradient-to-t from-[#08080f] via-[#08080f]/90 to-transparent">
          <div className="max-w-xl mx-auto lg:ml-0">
            {isJoined ? (
              <button
                onClick={handleLeave}
                disabled={joining}
                className="w-full py-5 rounded-2xl border border-white/10 bg-white/[0.02] text-white/40 text-[11px] font-black tracking-[0.3em] uppercase hover:bg-white/[0.05] hover:border-red-500/20 hover:text-red-400/60 transition-all duration-500 flex items-center justify-center gap-3"
              >
                {joining ? <Loader className="w-4 h-4 animate-spin" /> : <>✓ PART OF THE SIGNAL <span className="text-white/10">|</span> LEAVE</>}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining || (moment.capacity_limit > 0 && participantCount >= moment.capacity_limit)}
                className="group relative w-full h-[70px] rounded-2xl bg-gold overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(201,168,76,0.2)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#08080f] text-[13px] font-black tracking-[0.4em] uppercase">
                    {joining ? <Loader className="w-5 h-5 animate-spin" /> : 
                      (moment.capacity_limit > 0 && participantCount >= moment.capacity_limit ? "SIGNAL FULL" : "INITIALIZE JOIN")}
                  </span>
                </div>
              </button>
            )}
            <p className="text-center mt-4 text-[8px] tracking-[0.3em] uppercase text-white/15">
              Secure cryptographic signature required to join
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

