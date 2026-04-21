import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAPTILER_STYLE } from '../lib/constants'
import { useUserLocation } from '../hooks/useUserLocation'
import { Search, Shield, X, Users, MapPin, ExternalLink, Flame, Lock } from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ToastProvider'
import { useAuth } from '../contexts/AuthContext'
import { joinMoment, leaveMoment } from '../lib/db/moments'
import { useRealtimeMoments } from '../hooks/useRealtimeMoments'
import { supabase } from '../lib/supabase'
import { getSignalImage } from '../lib/signalImage'

// Distance utility
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapPage() {
  const navigate = useNavigate()
  usePageTitle('Forum')
  const { location, error: locationError } = useUserLocation()
  const [radius, setRadius] = useState('50 KM')
  const [filter, setFilter] = useState<'ALL' | 'MOMENTS' | 'EVENTS'>('ALL')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const radiusMap: Record<string, number> = {
    '5 KM': 5000,
    '50 KM': 50000,
    'PROVINCE': 150000,
    'COUNTRY': 500000,
    'GLOBAL': 999999999
  }

  const numericRadius = radiusMap[radius] || 50000
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMoments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_moments_map');
    
    if (error) {
      console.error('RPC get_moments_map error:', error);
    } else if (data) {
      setMoments(data);
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments])

  // Realtime Integration
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    setMoments(prev => {
      const idx = prev.findIndex(m => m.id === newMoment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newMoment
        return next
      }
      return [newMoment, ...prev]
    })
  }, [])

  const handleRealtimeDelete = useCallback((id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
    setSelectedMoment(prev => prev?.id === id ? null : prev)
  }, [])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)

  // Fetch joined status
  useEffect(() => {
    if (!currentUser) return;
    supabase
      .from('participants')
      .select('moment_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'joined')
      .then(({ data }) => {
        if (data) setJoinedIds(data.map(d => d.moment_id));
      });
  }, [currentUser]);

  const handleJoin = async (momentId: string) => {
    if (!currentUser) {
      addToast({ title: 'Authentication Required', description: 'Please sign in to join signals.', type: 'info' });
      return;
    }
    try {
      await joinMoment(momentId);
      setJoinedIds(prev => [...prev, momentId]);
      addToast({ 
        title: 'Signal Locked', 
        description: 'Connection established. Channel secure.', 
        type: 'signal' 
      });
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  const handleLeave = async (momentId: string) => {
    if (!currentUser) return;
    try {
      await leaveMoment(momentId);
      setJoinedIds(prev => prev.filter(id => id !== momentId));
      addToast({ 
        title: 'Connection Terminated', 
        description: 'Frequency connection released.', 
        type: 'info' 
      });
    } catch (err) {
      console.error('Leave failed:', err);
    }
  };

  const visibleMoments = useMemo(() => {
    return moments.filter(sig => {
      const lat = sig.lat
      const lng = sig.lng
      if ((lat == null || lng == null) && numericRadius < 99999999) return false

      if (numericRadius < 999999999 && location && lat != null && lng != null) {
        const dKm = haversineKm(location.latitude, location.longitude, lat, lng)
        if (dKm > numericRadius / 1000) return false
      }

      const typeFilter = filter.toLowerCase()
      if (typeFilter !== 'all') {
        const momentType = sig.moment_type === 'moment' ? 'moments' : 'events'
        if (typeFilter !== momentType) return false
      }
      return true
    })
  }, [moments, numericRadius, location, filter])

  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<{ [id: string]: Marker }>({})
  const userMarkerRef = useRef<Marker | null>(null)
  const hasFlownToUser = useRef(false)

  // Map Initialization
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: MAPTILER_STYLE,
      center: [79.8612, 6.9271],
      zoom: 13,
      attributionControl: false,
      renderWorldCopies: false
    })

    mapRef.current = map
    map.on('load', () => setMapLoaded(true))
    map.on('click', () => setSelectedMoment(null))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Manage Markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    // Remove old markers that are no longer visible
    Object.keys(markersRef.current).forEach(id => {
      if (!visibleMoments.find(m => m.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Add/Update markers for visible moments
    visibleMoments.forEach(m => {
      if (!m.lat || !m.lng) return
      
      if (markersRef.current[m.id]) {
        markersRef.current[m.id].setLngLat([m.lng, m.lat])
      } else {
        const el = document.createElement('div')
        el.className = 'cursor-pointer group'
        const isEvent = m.moment_type === 'event'
        
        el.innerHTML = isEvent ? `
          <div class="relative w-9 h-11 flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110">
            <svg width="36" height="42" viewBox="0 0 36 42" fill="none">
              <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 24 14 24S32 26 32 16C32 8.268 25.732 2 18 2z" fill="#08080f" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
              <circle cx="18" cy="16" r="6" fill="#c9a84c" fill-opacity="0.8"/>
            </svg>
          </div>
        ` : `
          <div class="relative w-9 h-9 flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(201,168,76,0.5)] transition-transform group-hover:scale-110">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" fill="#08080f" stroke="#c9a84c" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="6" fill="#c9a84c"/>
              <circle cx="18" cy="18" r="10" fill="#c9a84c" fill-opacity="0.15"/>
            </svg>
          </div>
        `

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const rect = el.getBoundingClientRect()
          const mapRect = map.getContainer().getBoundingClientRect()
          setPopupPos({
            x: rect.left - mapRect.left + rect.width / 2,
            y: rect.top - mapRect.top
          })
          setSelectedMoment(m)
        })

        const marker = new Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map)
        markersRef.current[m.id] = marker
      }
    })
  }, [visibleMoments, mapLoaded])

  // User Position
  useEffect(() => {
    if (!mapRef.current || !location) return
    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-[#4A90E2] rounded-full opacity-20 animate-ping"></div>
          <div class="w-4 h-4 bg-[#4A90E2] border-2 border-white rounded-full shadow-[0_0_10px_rgba(74,144,226,0.5)]"></div>
        </div>
      `
      userMarkerRef.current = new Marker({ element: el })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current)
    } else {
      userMarkerRef.current.setLngLat([location.longitude, location.latitude])
    }
  }, [location])

  // Initial Fly To
  useEffect(() => {
    if (location && !hasFlownToUser.current && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 14,
        duration: 2500
      })
      hasFlownToUser.current = true
    }
  }, [location])

  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1500
      })
    }
  }

  return (
    <div className="relative w-full h-screen bg-[#08080f] overflow-hidden flex flex-col font-sans">

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 lg:px-8 pt-7 pb-4"
        style={{ background: 'linear-gradient(to bottom, rgba(8,8,15,0.95) 0%, rgba(8,8,15,0) 100%)' }}>
        
        <div className="flex items-baseline gap-4 mb-5">
          <h1 className="text-white text-2xl lg:text-[32px] font-bold tracking-[0.08em] uppercase">Forum</h1>
          <span className="text-white/20 text-[8px] lg:text-[10px] tracking-[0.25em] uppercase">Geospatial Intelligence</span>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-4xl">
          <div className="relative flex-1">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-md">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="TARGET COORDINATES / EVENT SEARCH"
                className="flex-1 bg-transparent text-white/50 text-[10px] tracking-[0.18em] uppercase placeholder:text-white/20 outline-none"
              />
            </div>
            <div className="absolute left-0 bottom-0 h-px w-1/3 bg-gradient-to-r from-[#c9a84c]/40 to-transparent" />
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'MOMENTS', 'EVENTS'] as const).map(f => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelectedMoment(null);
                }}
                className="px-4 py-2 rounded-full text-[9px] font-bold tracking-[0.18em] uppercase transition-all duration-200 border"
                style={{
                  background: filter === f ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#08080f' : 'rgba(255,255,255,0.45)',
                  borderColor: filter === f ? 'transparent' : 'rgba(255,255,255,0.08)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* ── SELECTED MOMENT UI ── */}
      <AnimatePresence>
        {selectedMoment && (
          <>
            {/* Desktop Overlay Background */}
            <div 
              className="hidden lg:block absolute inset-0 z-[40]" 
              onClick={() => setSelectedMoment(null)} 
            />

            {/* Signal Details Content */}
            {(() => {
              const isJoined = joinedIds.includes(selectedMoment.id);
              const cardImage = getSignalImage(selectedMoment.id, selectedMoment.tags || [], selectedMoment.moment_type);
              const isEvent = selectedMoment.moment_type === 'event';
              
              const renderCardContent = (w: number, h: number) => (
                <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Image Section */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/${selectedMoment.id}/${w}/${h}`}
                      alt={selectedMoment.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://picsum.photos/seed/${selectedMoment.id}ab/${w}/${h}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
                    
                    {/* Lock Overlay if Joined */}
                    {isJoined && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                        <Lock className="w-8 h-8 text-[#c9a84c]/80 mb-1" />
                        <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[#c9a84c]">Joined Signal</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 border border-white/10 flex items-center gap-1.5">
                      <span className={cn("w-1 h-1 rounded-full", isEvent ? "bg-white" : "bg-[#c9a84c]")} />
                      <span className="text-[7px] font-bold tracking-widest uppercase text-white/70">
                        {selectedMoment.moment_type}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-black uppercase text-sm tracking-tight leading-tight line-clamp-2">
                        {selectedMoment.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Section */}
                  <div className="p-4 pt-3">
                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-white/40 text-[9px]">
                        <Users size={12} className="text-[#c9a84c]/50" />
                        <span>{selectedMoment.participant_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 text-[9px]">
                        <MapPin size={12} className="text-[#c9a84c]/50" />
                        <span>Nearby</span>
                      </div>
                      <div className="flex-1 text-right">
                        <span className="text-[8px] tracking-widest uppercase text-white/20">
                          by {selectedMoment.creator?.username || 'Anonymous'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedMoment(null)}
                        className="py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-white/30 text-[8px] font-black tracking-widest uppercase hover:text-red-400 hover:border-red-400/30 transition-all">
                        Reject
                      </button>
                      
                      {isJoined ? (
                        <button
                          onClick={() => handleLeave(selectedMoment.id)}
                          className="py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[8px] font-black tracking-widest uppercase transition-all">
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(selectedMoment.id)}
                          className="py-2.5 rounded-xl text-void text-[8px] font-black tracking-widest uppercase transition-all shadow-lg shadow-[#c9a84c]/20"
                          style={{ background: 'linear-gradient(135deg, #c9a84c, #dfc070)' }}>
                          Join
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigate(`/app/${isEvent ? 'event' : 'moment'}/${selectedMoment.id}`);
                          setSelectedMoment(null);
                        }}
                        className="py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-[8px] font-black tracking-widest uppercase hover:bg-white/[0.1] transition-all flex items-center justify-center gap-1">
                        Go <ExternalLink size={8} />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Pointer */}
                  <div className="hidden lg:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f0f1a] border-r border-b border-white/10 rotate-45" />
                </div>
              );

              return (
                <>
                  {/* MOBILE BOTTOM SHEET */}
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="lg:hidden fixed left-0 right-0 z-[100] px-4 pointer-events-none"
                    style={{ bottom: 'calc(64px + 12px + env(safe-area-inset-bottom))' }}
                  >
                    <div className="w-full max-w-md mx-auto pointer-events-auto">
                      {renderCardContent(800, 400)}
                    </div>
                  </motion.div>

                  {/* DESKTOP FLOATING CARD */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="hidden lg:block absolute z-[100] w-[300px] pointer-events-auto"
                    style={{
                      left: popupPos.x,
                      top: popupPos.y,
                      transform: 'translate(-50%, calc(-100% - 24px))'
                    }}
                  >
                    {renderCardContent(600, 300)}
                  </motion.div>
                </>
              );
            })()}
          </>
        )}
      </AnimatePresence>

      {/* ── BOTTOM RADIUS PILLS ── */}
      <div className="absolute bottom-32 lg:bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[90vw] overflow-x-auto pb-2 scrollbar-none">
        {['5 KM', '50 KM', 'PROVINCE', 'COUNTRY', 'GLOBAL'].map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className="px-4 py-2 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase transition-all duration-200 backdrop-blur-md"
            style={{
              background: radius === r ? '#c9a84c' : 'rgba(8,8,15,0.7)',
              color: radius === r ? '#08080f' : 'rgba(255,255,255,0.5)',
              border: radius === r ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ── STATUS BAR ── */}
      <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 whitespace-nowrap opacity-40">
        <span className="w-1 h-1 rounded-full bg-[#c9a84c] animate-pulse" />
        <span className="text-white text-[8px] tracking-[0.25em] uppercase">
          {visibleMoments.length} Signals Captured · {radius} Range
        </span>
      </div>

      {/* ── UTILITY BUTTONS ── */}
      <div className="absolute top-24 right-4 lg:top-8 lg:right-8 z-20 flex flex-col gap-3">
        <button
          onClick={recenterMap}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-white/20 transition-all text-white/60"
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-md">
          <Shield className="w-3 h-3 text-red-400" />
          <span className="text-[9px] text-red-400 tracking-widest uppercase font-bold">Signal Interference</span>
        </div>
      )}

    </div>
  )
}
