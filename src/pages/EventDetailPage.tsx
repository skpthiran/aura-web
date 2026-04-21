import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Users, Clock, MapPin, MessageSquare, ExternalLink, Loader, Share2, Check, Calendar, Shield, Shirt } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import { MomentDetailSkeleton } from '../components/Skeleton'
import { format } from 'date-fns'
import { getSignalImage } from '../lib/signalImage'
import { cn } from '../lib/utils'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [creator, setCreator] = useState<any | null>(null)

  usePageTitle(event?.title ?? 'Gathering')

  useEffect(() => {
    if (!id) return
    fetchEvent()
    checkIfJoined()
  }, [id, user])

  const fetchEvent = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*, creator:profiles(id, username, avatar_url)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      if (!data) return
      
      setEvent(data)
      if (data.creator) setCreator(data.creator)
    } catch (err) {
      console.error('Fetch error:', err)
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
        await navigator.share({ title: event?.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  if (loading) return <MomentDetailSkeleton />
  if (!event) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#08080f]">
       <h1 className="font-serif text-2xl text-marble/20">Frequency Lost</h1>
       <button onClick={() => navigate(-1)} className="mt-4 text-gold text-sm underline">Return to Forum</button>
    </div>
  )

  const startDate = event.start_time ? new Date(event.start_time) : null
  const formattedTime = startDate ? format(startDate, 'h:mm a') : 'TBA'
  const formattedDate = startDate ? format(startDate, 'EEEE, MMM do') : 'TBA'
  
  const distanceLabel = event.distance_meters 
    ? (event.distance_meters > 1000 ? `${(event.distance_meters / 1000).toFixed(1)}km` : `${Math.round(event.distance_meters)}m`)
    : 'Local Sector'

  const hasValidImageUrl = event.image_url && event.image_url.startsWith('http');
  const displayImage = (!imgError && hasValidImageUrl) 
    ? event.image_url 
    : getSignalImage(event.id, event.tags, 'event');

  const isFull = event.capacity_limit > 0 && (event.attendee_count || 0) >= event.capacity_limit;

  return (
    <div className="min-h-screen bg-[#08080f] lg:flex lg:flex-row overflow-x-hidden">
      {/* ── HERO ── */}
      <div className="relative w-full lg:w-[50%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden bg-obsidian">
        {displayImage ? (
          <img 
            src={displayImage} 
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" 
            alt={event.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1628] via-[#130e1f] to-[#08080f]" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/40 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />

        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/60 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-gold/40 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="absolute bottom-12 left-12 right-12 z-20 hidden lg:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-gold/90 text-void font-black text-[9px] tracking-[0.2em] uppercase rounded-sm">Structured</div>
            <div className="px-3 py-1 border border-white/20 bg-white/5 backdrop-blur-md text-white text-[9px] tracking-[0.2em] uppercase rounded-sm">Priority Alpha</div>
          </div>
          <h1 className="text-white font-black uppercase text-7xl leading-[0.85] tracking-tighter mb-8 max-w-2xl drop-shadow-2xl">
            {event.title}
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-gold/40 text-[9px] font-black tracking-[0.2em] uppercase mb-1">Schedule</span>
              <span className="text-white font-bold tracking-widest">{formattedDate} @ {formattedTime}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-gold/40 text-[9px] font-black tracking-[0.2em] uppercase mb-1">Intelligence</span>
              <span className="text-white font-bold tracking-widest">{event.attendee_count || 0} / {event.capacity_limit || '∞'} CONFIRMED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="relative flex-1 bg-[#08080f] px-6 lg:px-20 pt-12 lg:pt-32 pb-48 lg:border-l border-white/5">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-12">
          <p className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-4">Structured Gathering</p>
          <h1 className="text-white font-black uppercase text-4xl leading-tight tracking-tight mb-6">{event.title}</h1>
          
          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden mt-8">
            <div className="bg-void/50 p-5">
              <p className="text-white/30 text-[8px] tracking-widest uppercase mb-1">Time</p>
              <p className="text-white font-black text-sm">{formattedTime}</p>
            </div>
            <div className="bg-void/50 p-5">
              <p className="text-white/30 text-[8px] tracking-widest uppercase mb-1">Date</p>
              <p className="text-white font-black text-sm">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Briefing */}
        <div className="max-w-2xl space-y-16">
          <section>
            <h3 className="text-gold/60 text-[10px] font-black tracking-[0.3em] uppercase mb-6 flex items-center gap-4">
              <span className="w-8 h-px bg-gold/20" />
              Primary Objective
            </h3>
            <p className="text-white/80 text-xl font-serif italic leading-relaxed">
              "{event.description || "Intelligence encrypted or missing. Proceed with intuition."}"
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-gold/60 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-4">
                <span className="w-8 h-px bg-gold/20" />
                Location
              </h3>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                    <MapPin className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-bold tracking-widest uppercase text-xs">{event.venue || 'SECURE LOCATION'}</p>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">{distanceLabel}</p>
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg border border-white/5 bg-white/5 text-white/40 text-[9px] font-black tracking-widest uppercase group-hover:text-gold group-hover:border-gold/30 transition-all flex items-center justify-center gap-2">
                  Open Coordinates <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-gold/60 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-4">
                <span className="w-8 h-px bg-gold/20" />
                Requirements
              </h3>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shirt className="w-3.5 h-3.5 text-gold/40" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Dress Code</span>
                  </div>
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">{event.dresscode || 'Casual'}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-3.5 h-3.5 text-gold/40" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Security</span>
                  </div>
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">Verified Identity</span>
                </div>
              </div>
            </div>
          </section>

          {creator && (
            <section className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer"
                   onClick={() => navigate(`/app/user/${creator.id}`)}>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/20 p-1">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white/5">
                        {creator.avatar_url 
                          ? <img src={creator.avatar_url} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center text-lg font-black text-gold/40">{(creator.username || '?')[0].toUpperCase()}</div>
                        }
                      </div>
                   </div>
                   <div>
                      <p className="text-gold/60 text-[9px] font-black tracking-[0.3em] uppercase mb-1">Architect</p>
                      <p className="text-white text-lg font-black tracking-widest uppercase">{creator.username}</p>
                   </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        <div className="fixed lg:absolute bottom-0 left-0 right-0 p-6 lg:p-12 z-50 bg-gradient-to-t from-[#08080f] via-[#08080f]/95 to-transparent">
          <div className="max-w-md mx-auto lg:ml-0">
            {joined ? (
              <button
                onClick={handleLeave}
                disabled={joining}
                className="w-full py-5 rounded-sm border border-white/10 bg-white/[0.02] text-white/40 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-white/[0.05] hover:border-red-500/20 hover:text-red-400/60 transition-all duration-500 flex items-center justify-center gap-3"
              >
                {joining ? <Loader className="w-4 h-4 animate-spin" /> : <>✓ ACCESS GRANTED <span className="text-white/10">|</span> WITHDRAW</>}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining || isFull}
                className="w-full py-5 rounded-sm text-void text-[12px] font-black tracking-[0.3em] uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(201,168,76,0.2)]"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #e2c06a, #c9a84c)' }}
              >
                {joining ? <Loader className="w-5 h-5 animate-spin mx-auto text-void" /> : 
                  (isFull ? "CAPACITY REACHED" : "INITIALIZE JOIN")}
              </button>
            )}
            <p className="text-center mt-4 text-[9px] text-white/20 tracking-[0.2em] uppercase font-bold">SECURE CHANNEL ENCRYPTED ALPHA-9</p>
          </div>
        </div>

      </div>
    </div>
  );
}
