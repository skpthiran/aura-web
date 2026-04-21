import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAPTILER_STYLE } from '../lib/constants'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Crosshair, Search, Flame, Target, Users, Settings2, Target as Radar, Loader, Shield, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ToastProvider'
import { useRealtimeMoments } from '../hooks/useRealtimeMoments'
import { calculateDistance } from '../lib/utils'
import { supabase } from '../lib/supabase'



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
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const radiusMap: Record<string, number> = {
    '5 KM': 5000,
    '50 KM': 50000,
    'PROVINCE': 150000,
    'COUNTRY': 500000,
    'GLOBAL': 999999999
  }

  const [filter, setFilter] = useState<'ALL' | 'MOMENTS' | 'EVENTS'>('ALL')
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

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

  const { addToast } = useToast()

  // Realtime Integration for Map
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

    if (location && newMoment.lat !== undefined && newMoment.lng !== undefined) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        newMoment.lat,
        newMoment.lng
      )
      
      if (dist <= numericRadius) {
        addToast({
          title: newMoment.title,
          description: `Intercepted new ${newMoment.moment_type} at coordinates.`,
          link: `/app/moment/${newMoment.id}`,
          type: 'signal'
        })
      }
    }
  }, [location, numericRadius, addToast, setMoments])

  const handleRealtimeDelete = useCallback((id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
    setSelectedMoment(prev => prev?.id === id ? null : prev)
  }, [setMoments])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)

  // === SIGNAL FILTERING ===
  const visibleMoments: Moment[] = []
  for (let idx = 0; idx < moments.length; idx++) {
    const sig = moments[idx]
    const lat = sig.lat
    const lng = sig.lng
    
    if ((lat == null || lng == null) && numericRadius < 99999999) continue

    if (numericRadius < 999999999 && location && lat != null && lng != null) {
      const dKm = haversineKm(
        location.latitude, location.longitude,
        lat, lng
      )
      if (dKm > numericRadius / 1000) continue
    }
    const typeFilter = filter.toLowerCase()
    if (typeFilter !== 'all') {
      const momentType = sig.moment_type === 'moment' ? 'moments' : 'events'
      if (typeFilter !== momentType) continue
    }
    visibleMoments.push(sig)
  }

  // Radius Circle Visualization
  const updateRadiusCircle = useCallback(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const safeRemove = () => {
      try {
        if (map.getLayer('radius-fill')) map.removeLayer('radius-fill')
        if (map.getLayer('radius-outline')) map.removeLayer('radius-outline')
        if (map.getSource('radius-source')) map.removeSource('radius-source')
      } catch {}
    }

    if (!location || numericRadius >= 999999999) {
      safeRemove()
      return
    }

    const radiusKm = numericRadius / 1000
    const points = 64
    const coords: [number, number][] = Array.from({ length: points + 1 }, (_, i) => {
      const angle = (i / points) * 2 * Math.PI
      const lat = location.latitude + (radiusKm / 111.32) * Math.cos(angle)
      const lng = location.longitude +
        (radiusKm / (111.32 * Math.cos(location.latitude * Math.PI / 180))) * Math.sin(angle)
      return [lng, lat]
    })

    const geojsonData = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      }
    }

    try {
      if (map.getSource('radius-source')) {
        (map.getSource('radius-source') as any).setData(geojsonData)
      } else {
        map.addSource('radius-source', { type: 'geojson', data: geojsonData })
        map.addLayer({
          id: 'radius-fill',
          type: 'fill',
          source: 'radius-source',
          paint: { 'fill-color': '#C9A84C', 'fill-opacity': 0.04 }
        })
        map.addLayer({
          id: 'radius-outline',
          type: 'line',
          source: 'radius-source',
          paint: {
            'line-color': '#C9A84C',
            'line-opacity': 0.3,
            'line-width': 1.5,
            'line-dasharray': [4, 4]
          }
        })
      }
    } catch (err) {
      console.warn('Radius circle error:', err)
    }
  }, [location, numericRadius, mapLoaded])

  useEffect(() => {
    updateRadiusCircle()
  }, [updateRadiusCircle])

  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const hasFlownToUser = useRef(false)
  const markersRef = useRef<{ [id: string]: Marker }>({})

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

    const createMomentIcon = () => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          position: relative;
          width: 36px; height: 36px;
          cursor: pointer;
          filter: drop-shadow(0 0 8px rgba(201,168,76,0.7));
        ">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" fill="#08080f" stroke="#c9a84c" stroke-width="1.5"/>
            <circle cx="18" cy="18" r="6" fill="#c9a84c"/>
            <circle cx="18" cy="18" r="10" fill="#c9a84c" fill-opacity="0.15"/>
          </svg>
        </div>
      `;
      el.style.cssText = 'width:36px;height:36px;cursor:pointer;';
      return el;
    };

    const createEventIcon = () => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          position: relative;
          width: 36px; height: 42px;
          cursor: pointer;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
        ">
          <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 24 14 24S32 26 32 16C32 8.268 25.732 2 18 2z" 
              fill="#08080f" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
            <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 24 14 24S32 26 32 16C32 8.268 25.732 2 18 2z" 
              fill="rgba(255,255,255,0.05)"/>
            <rect x="13" y="10" width="10" height="2" rx="1" fill="white" fill-opacity="0.8"/>
            <rect x="13" y="14" width="7" height="2" rx="1" fill="white" fill-opacity="0.5"/>
            <circle cx="18" cy="20" r="2" fill="rgba(201,168,76,0.8)"/>
          </svg>
        </div>
      `;
      el.style.cssText = 'width:36px;height:42px;cursor:pointer;';
      return el;
    };

    const addMomentsToMap = (mMap: MapLibreMap, momentsData: any[]) => {
      momentsData.forEach((m) => {
        if (!m.lat || !m.lng) return;
        const el = m.moment_type === 'event' ? createEventIcon() : createMomentIcon();
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const rect = el.getBoundingClientRect();
          const mapContainerRect = mMap.getContainer().getBoundingClientRect();
          setPopupPos({
            x: rect.left - mapContainerRect.left + rect.width / 2,
            y: rect.top - mapContainerRect.top,
          });
          setActiveSignal(m);
        });

        new Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(mMap);
      });
    };

    map.on('load', async () => {
      setMapLoaded(true)
      const { data } = await supabase.rpc('get_moments_map');
      if (data) addMomentsToMap(map, data);
    })

    map.on('click', () => setActiveSignal(null));

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (location && !hasFlownToUser.current && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 2000
      })
      hasFlownToUser.current = true
    }
  }, [location])

  useEffect(() => {
    if (!mapRef.current || !location) return
    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'user-marker'
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
  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1500
      })
    }
  }


  const handleJoinMoment = async () => {
    if (!selectedMoment) return
    setIsJoining(true)
    try {
      await joinMoment(selectedMoment.id)
      setHasJoined(true)
      fetchMoments()
    } catch (err: any) {
      console.error('Failed to join moment:', err)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="relative w-full h-screen bg-[#08080f] overflow-hidden flex flex-col">

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-8 pt-7 pb-4"
        style={{ background: 'linear-gradient(to bottom, rgba(8,8,15,0.95) 0%, rgba(8,8,15,0) 100%)' }}>
        
        <div className="flex items-baseline gap-4 mb-5">
          <h1 className="text-white text-[32px] font-bold tracking-[0.08em] uppercase">Forum</h1>
          <span className="text-white/20 text-[10px] tracking-[0.25em] uppercase">Geospatial Intelligence</span>
        </div>

        {/* Search bar */}
        <div className="relative mb-4 max-w-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="TARGET COORDINATES / EVENT SEARCH"
              className="flex-1 bg-transparent text-white/50 text-[10px] tracking-[0.18em] uppercase placeholder:text-white/20 outline-none"
            />
          </div>
          <div className="absolute left-0 bottom-0 h-px w-1/3 bg-gradient-to-r from-[#c9a84c]/40 to-transparent" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {(['ALL', 'MOMENTS', 'EVENTS'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.18em] uppercase transition-all duration-200"
              style={{
                background: filter === f ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#08080f' : 'rgba(255,255,255,0.45)',
                border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP ── */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* ── POPUP (keep existing activeSignal popup JSX here unchanged) ── */}
      {activeSignal && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            position: 'absolute',
            left: Math.min(popupPos.x, window.innerWidth - 320) + 'px',
            top: (popupPos.y - 20) + 'px',
            transform: 'translate(-50%, -100%)',
            zIndex: 50,
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
          }}
        >
          <div style={{
            width: '300px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#0f0f1a',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          }}>
            
            {/* Image or gradient header */}
            <div className="relative h-[140px] overflow-hidden">
              {activeSignal.image_url ? (
                <img src={activeSignal.image_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1e1628] via-[#130e1f] to-[#08080f]">
                  <div className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c9a84c, transparent 70%)' }} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
              
              {/* Close button */}
              <button
                onClick={() => setActiveSignal(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <span className="text-white/60 text-[12px] leading-none">✕</span>
              </button>

              {/* Type badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-[#c9a84c]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                <span className="text-[8px] font-black tracking-[0.18em] uppercase text-[#c9a84c]">
                  {activeSignal.moment_type || 'Moment'}
                </span>
              </div>

              {/* Title over bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                <h3 className="text-white font-black uppercase text-[16px] tracking-[0.05em] leading-tight drop-shadow-lg line-clamp-2">
                  {activeSignal.title}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pt-3 pb-4" style={{ background: '#0f0f1a' }}>
              {/* Tags */}
              {activeSignal.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {activeSignal.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/40 text-[8px] tracking-widest uppercase">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>{activeSignal.participant_count ?? 0} attending</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{activeSignal.creator?.username || 'Anonymous'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2" style={{ background: '#0f0f1a' }}>
                <button
                  onClick={() => setActiveSignal(null)}
                  className="py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-white/35 text-[9px] font-bold tracking-[0.15em] uppercase hover:border-red-500/20 hover:text-red-400/50 transition-all">
                  Reject
                </button>
                <button
                  onClick={() => {
                    // handle join logic if needed, or just close
                    setActiveSignal(null);
                  }}
                  className="py-2.5 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-[#c9a84c]/20 transition-all">
                  Join
                </button>
                <button
                  onClick={() => {
                    navigate(`/app/${activeSignal.moment_type === 'event' ? 'event' : 'moment'}/${activeSignal.id}`);
                    setActiveSignal(null);
                  }}
                  className="py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-white/[0.1] transition-all">
                  Details
                </button>
              </div>
            </div>

            {/* Pointer arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
              <div className="w-4 h-4 bg-[#0f0f1a] border-r border-b border-white/10 rotate-45 -translate-y-2" />
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM RADIUS PILLS ── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {['5 KM', '50 KM', 'PROVINCE', 'COUNTRY', 'GLOBAL'].map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className="px-4 py-2 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase transition-all duration-200"
            style={{
              background: radius === r ? '#c9a84c' : 'rgba(8,8,15,0.85)',
              color: radius === r ? '#08080f' : 'rgba(255,255,255,0.5)',
              border: radius === r ? 'none' : '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ── STATUS BAR ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
        <span className="text-white/30 text-[9px] tracking-[0.22em] uppercase">
          {moments.length} Active Signal{moments.length !== 1 ? 's' : ''} · Live Radius: {radius}
        </span>
      </div>

      {/* ── RECENTER BUTTON ── */}
      <button
        onClick={recenterMap}
        className="absolute top-7 right-7 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-white/20 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      </button>

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-md">
          <Shield className="w-3 h-3 text-red-400" />
          <span className="text-[9px] text-red-400 tracking-widest uppercase font-bold">Signal Interference / Position Unavailable</span>
        </div>
      )}

    </div>
  )
}
