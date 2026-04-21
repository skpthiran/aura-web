import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl'
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
import { RADIUS_OPTIONS, DEFAULT_RADIUS, getRadiusValue } from '../lib/radius'

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
  const [radius, setRadius] = useState<string>('50 KM')
  const [filter, setFilter] = useState<'ALL' | 'MOMENTS' | 'EVENTS'>('ALL')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [isRadiusOpen, setIsRadiusOpen] = useState(false)
  const radiusDropdownRef = useRef<HTMLDivElement>(null)

  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const fetchMoments = useCallback(async () => {
    if (!location) return;
    setLoading(true)
    const radiusValue = getRadiusValue(radius)
    const { data, error } = await supabase.rpc('nearby_moments', {
      user_lat: location.latitude,
      user_lng: location.longitude,
      radius_km: radiusValue
    });
    
    if (error) {
      console.error('RPC nearby_moments error:', error);
    } else if (data) {
      setMoments(data);
    }
    setLoading(false)
  }, [location, radius])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments])

  // Realtime Integration
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    if (!location) return;
    
    const dist = haversineKm(
      location.latitude,
      location.longitude,
      newMoment.lat!,
      newMoment.lng!
    );
    
    // Check if within current radius
    const radiusValue = getRadiusValue(radius)
    if (radiusValue === 0 || dist <= radiusValue) {
      setMoments(prev => {
        const idx = prev.findIndex(m => m.id === newMoment.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = newMoment
          return next
        }
        return [newMoment, ...prev]
      })
    }
  }, [location, radius])

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
      const typeFilter = filter.toLowerCase()
      if (typeFilter !== 'all') {
        const momentType = sig.moment_type === 'moment' ? 'moments' : 'events'
        if (typeFilter !== momentType) return false
      }
      return true
    })
  }, [moments, filter])

  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (radiusDropdownRef.current && !radiusDropdownRef.current.contains(e.target as Node)) {
        setIsRadiusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Manage Markers (GeoJSON Symbol Layer)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !visibleMoments.length) {
      if (map && mapLoaded && visibleMoments.length === 0) {
        // Clear layer if no signals
        if (map.getSource('signals')) {
          (map.getSource('signals') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: []
          })
        }
      }
      return
    }

    // ── SVG icon definitions ──
    const lightningsvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="#ef4444" stroke="rgba(239,68,68,0.6)" stroke-width="2"/>
      <polygon points="20,6 10,20 17,20 16,30 26,16 19,16" fill="#08080f"/>
    </svg>`

    const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="#c9a84c" stroke="rgba(201,168,76,0.6)" stroke-width="2"/>
      <rect x="10" y="12" width="16" height="14" rx="2" fill="none" stroke="#08080f" stroke-width="2"/>
      <line x1="10" y1="17" x2="26" y2="17" stroke="#08080f" stroke-width="2"/>
      <line x1="14" y1="9" x2="14" y2="14" stroke="#08080f" stroke-width="2"/>
      <line x1="22" y1="9" x2="22" y2="14" stroke="#08080f" stroke-width="2"/>
    </svg>`

    const svgToImage = (svg: string, name: string): Promise<void> => {
      return new Promise((resolve) => {
        if (map.hasImage(name)) { resolve(); return }
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const img = new Image(36, 36)
        img.onload = () => {
          map.addImage(name, img)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.src = url
      })
    }

    const buildLayers = async () => {
      await svgToImage(lightningsvg, 'moment-icon')
      await svgToImage(calendarSvg, 'event-icon')

      // GeoJSON source
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: visibleMoments.map(m => ({
          type: 'Feature',
          geometry: { 
            type: 'Point', 
            coordinates: [m.lng ?? 0, m.lat ?? 0] 
          },
          properties: { id: m.id, type: m.moment_type }
        }))
      }

      const source = map.getSource('signals') as maplibregl.GeoJSONSource
      if (source) {
        source.setData(geojson)
      } else {
        map.addSource('signals', { type: 'geojson', data: geojson })

        map.addLayer({
          id: 'signal-icons',
          type: 'symbol',
          source: 'signals',
          layout: {
            'icon-image': ['match', ['get', 'type'], 'event', 'event-icon', 'moment-icon'],
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          }
        })
      }
    }

    buildLayers()
  }, [visibleMoments, mapLoaded])

  // Click & Hover Interaction (WebGL Layer)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['signal-icons'] })
      if (features.length > 0) {
        const props = features[0].properties
        const hit = visibleMoments.find(m => m.id === props?.id)
        if (hit) {
          setSelectedMoment(hit)
          setPopupPos({ x: e.point.x, y: e.point.y })
        }
      } else {
        setSelectedMoment(null)
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['signal-icons'] })
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : ''
    }

    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
    }
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
    <div
      className="relative flex flex-col bg-[#08080f] overflow-hidden lg:h-screen"
      style={{ height: '100dvh' }}
    >

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

            {/* Radius Dropdown */}
            <div ref={radiusDropdownRef} className="relative flex flex-col items-start">
              <button
                onClick={() => setIsRadiusOpen(prev => !prev)}
                className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[9px] font-bold tracking-[0.15em] uppercase text-white/60 hover:border-white/20 hover:text-white/80 transition-all whitespace-nowrap"
              >
                {radius}
              </button>
              <AnimatePresence>
                {isRadiusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 rounded-xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur-xl max-h-64 overflow-y-auto"
                  >
                    {RADIUS_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => { setRadius(opt.label); setIsRadiusOpen(false); setSelectedMoment(null); }}
                        className="w-full px-4 py-2.5 text-left text-[9px] font-bold tracking-[0.15em] uppercase transition-colors hover:bg-white/5 whitespace-nowrap"
                        style={{ color: radius === opt.label ? '#c9a84c' : 'rgba(255,255,255,0.5)' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div
        ref={mapContainer}
        className="flex-1 w-full"
        style={{ minHeight: 0 }}
      />

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
                      src={selectedMoment.image_url || `https://picsum.photos/seed/${selectedMoment.id}/800/600`}
                      alt={selectedMoment.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                    style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
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

      {/* ── STATUS BAR ── */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 whitespace-nowrap opacity-40"
        style={{ bottom: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '3rem' : 'calc(88px + env(safe-area-inset-bottom))' }}
      >
        <span className="w-1 h-1 rounded-full bg-[#c9a84c] animate-pulse" />
        <span className="text-white text-[8px] tracking-[0.25em] uppercase">
          {visibleMoments.length} Signals Captured · {radius} Range
        </span>
      </div>

      <div className="absolute top-24 right-4 lg:top-8 lg:right-8 z-20 flex flex-col gap-3">
        {/* Recenter Button */}
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
