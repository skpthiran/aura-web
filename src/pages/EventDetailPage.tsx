import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Users, Clock, MapPin, Calendar, Target, ExternalLink, Shirt, Shield, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import { MomentDetailSkeleton } from '../components/Skeleton'
import { getSignalImage } from '../lib/signalImage'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)

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
    if (data?.status === 'joined') setIsJoined(true)
  }

  const handleJoin = async () => {
    if (!id || isJoined) return
    try {
      setJoining(true)
      await joinMoment(id)
      setIsJoined(true)
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!id || !isJoined) return
    try {
      setJoining(true)
      await leaveMoment(id)
      setIsJoined(false)
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <MomentDetailSkeleton />
  if (!event) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#08080f]">
       <h1 className="font-serif text-2xl text-marble/20">Frequency Lost</h1>
       <button onClick={() => navigate(-1)} className="mt-4 text-gold text-sm underline">Return to Forum</button>
    </div>
  )

  const heroImage = getSignalImage(event.id || id, event.tags || [], event.moment_type || 'event');

  return (
    <div className="min-h-screen bg-[#08080f] lg:flex">

      {/* HERO */}
      <div
        className="relative w-full lg:w-[50%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden"
        style={{ height: '55vw', maxHeight: '500px', minHeight: '280px' }}
      >
        <img
          src={heroImage}
          alt={event?.title || 'Event'}
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `https://picsum.photos/seed/${id}/1200/800`;
          }}
        />
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
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#c9a84c]">Event</span>
        </div>

        {/* Desktop title */}
        <div className="absolute bottom-0 left-0 right-0 p-8 hidden lg:block">
          <div className="flex flex-wrap gap-2 mb-4">
            {event?.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 text-[9px] tracking-[0.15em] uppercase">#{tag}</span>
            ))}
          </div>
          <h1 className="text-white font-black uppercase leading-[0.92] drop-shadow-2xl"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '0.04em' }}>
            {event?.title}
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col lg:h-screen lg:overflow-y-auto">
        <div className="flex-1 px-6 lg:px-10 pt-7 lg:pt-14 pb-36 lg:pb-10">

          {/* Mobile title */}
          <div className="lg:hidden mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {event?.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/40 text-[9px] tracking-[0.15em] uppercase">#{tag}</span>
              ))}
            </div>
            <h1 className="text-white font-black uppercase text-[28px] tracking-[0.03em] leading-tight">{event?.title}</h1>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            {[
              { Icon: Users, value: event?.participant_count ?? 0, label: 'Attending' },
              { Icon: Target, value: event?.capacity_limit ?? '∞', label: 'Capacity' },
              { Icon: Calendar, value: event?.start_time ? new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', label: 'Date' },
              { Icon: Clock, value: event?.start_time ? new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', label: 'Time' },
            ].map(({ Icon, value, label }) => (
              <div key={label}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center gap-2 hover:border-[#c9a84c]/20 transition-all duration-300">
                <Icon className="w-4 h-4 text-[#c9a84c]/50" strokeWidth={1.5} />
                <p className="text-white font-bold text-[17px] leading-none">{value}</p>
                <p className="text-white/25 text-[8px] tracking-[0.2em] uppercase">{label}</p>
              </div>
            ))}
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-[#c9a84c]/25 to-transparent" />
            <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">Event Details</span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#c9a84c]/25 to-transparent" />
          </div>

          {/* ORGANIZER */}
          {event?.creator && (
            <div
              onClick={() => navigate(`/app/profile/${event.creator_id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-6 cursor-pointer hover:border-[#c9a84c]/20 hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gradient-to-br from-[#c9a84c]/20 to-transparent flex items-center justify-center">
                {event.creator.avatar_url
                  ? <img src={event.creator.avatar_url} className="w-full h-full object-cover" />
                  : <span className="text-[15px] font-black text-[#c9a84c] uppercase">{event.creator.username?.[0].toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] tracking-[0.25em] uppercase text-white/25 mb-0.5">Organized by</p>
                <p className="text-white font-bold text-[13px] tracking-widest uppercase truncate">{event.creator.username}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-[#c9a84c]/50 transition-colors flex-shrink-0" />
            </div>
          )}

          {/* VENUE + DRESSCODE ROW */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {event?.venue && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <MapPin className="w-4 h-4 text-[#c9a84c]/40 flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-[8px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Venue</p>
                  <p className="text-white/60 text-[12px] font-medium truncate">{event.venue}</p>
                </div>
              </div>
            )}
            {event?.dresscode && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <Shirt className="w-4 h-4 text-[#c9a84c]/40 flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-[8px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Dress Code</p>
                  <p className="text-white/60 text-[12px] font-medium truncate">{event.dresscode}</p>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="mb-6">
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#c9a84c]/40 mb-3 flex items-center gap-2">
              <span className="h-px w-5 bg-[#c9a84c]/30 inline-block" />
              About This Event
            </p>
            <p className="text-white/55 text-[14px] leading-[1.8] font-light">{event?.description}</p>
          </div>

          {/* AGE RESTRICTION */}
          {(event?.age_min || event?.age_max) && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
              <Shield className="w-4 h-4 text-[#c9a84c]/40 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[8px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Age Requirement</p>
                <p className="text-white/60 text-[12px] font-medium">
                  {event.age_min && event.age_max
                    ? `${event.age_min} – ${event.age_max} years`
                    : event.age_min
                    ? `${event.age_min}+ years`
                    : `Under ${event.age_max}`}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* MOBILE FIXED BOTTOM */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4"
          style={{
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            paddingTop: '12px',
            background: 'linear-gradient(to top, #08080f 70%, rgba(8,8,15,0.95) 85%, transparent)',
          }}>
          {isJoined ? (
            <button onClick={handleLeave}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/[0.03] text-white/40 text-[12px] font-bold tracking-[0.22em] uppercase hover:border-red-500/25 hover:text-red-400/50 transition-all active:scale-[0.98]">
              ✓ Attending · Tap to Leave
            </button>
          ) : (
            <button onClick={handleJoin}
              className="w-full py-4 rounded-2xl text-[#08080f] text-[12px] font-black tracking-[0.22em] uppercase transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-[#c9a84c]/20"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #dfc070 50%, #c9a84c 100%)' }}>
              Attend Event
            </button>
          )}
        </div>

        {/* DESKTOP STICKY BOTTOM */}
        <div className="hidden lg:block sticky bottom-0 px-10 pb-8 pt-5 bg-gradient-to-t from-[#08080f] via-[#08080f]/95 to-transparent">
          {isJoined ? (
            <button onClick={handleLeave}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/[0.03] text-white/35 text-[11px] font-bold tracking-[0.22em] uppercase hover:border-red-500/20 hover:text-red-400/40 transition-all duration-300">
              ✓ Attending · Tap to Leave
            </button>
          ) : (
            <button onClick={handleJoin}
              className="w-full py-4 rounded-2xl text-[#08080f] text-[12px] font-black tracking-[0.22em] uppercase transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-[#c9a84c]/20"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #dfc070 50%, #c9a84c 100%)' }}>
              Attend Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

