import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  usePageTitle('Forum')
  const { location, error: locationError } = useUserLocation()
  const [mapRadius, setMapRadius] = useState<number | string>(50000) // default 50km
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const radiusOptions = [5, 50, 'Province', 'Country']
  const radiusMap: Record<string | number, number> = {
    5: 5000,
    50: 50000,
    'Province': 150000,
    'Country': 500000
  }

  const [mapFilter, setMapFilter] = useState<'ALL' | 'MOMENTS' | 'EVENTS'>('ALL')

  const numericRadius = typeof mapRadius === 'number' ? radiusMap[mapRadius] || mapRadius : radiusMap[mapRadius] || 50000
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMoments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('moments')
      .select('*, creator:profiles(id, username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (data) setMoments(data)
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

    if (location && newMoment.latitude !== undefined && newMoment.longitude !== undefined) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        newMoment.latitude,
        newMoment.longitude
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
    if (numericRadius < 99999999 && location) {
      const dKm = haversineKm(
        location.latitude, location.longitude,
        sig.latitude || sig.lat || 0, 
        sig.longitude || sig.lng || 0
      )
      if (dKm > numericRadius / 1000) continue
    }
    const typeFilter = mapFilter.toLowerCase()
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

    if (!location || numericRadius >= 99999999) {
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
    map.on('load', () => setMapLoaded(true))

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

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const syncMarkers = () => {
      const currentIds = new Set(visibleMoments.map(m => m.id))
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      visibleMoments.forEach(sig => {
        const lat = sig.latitude ?? sig.lat ?? null;
        const lng = sig.longitude ?? sig.lng ?? null;
        
        if (lat === null || lng === null) return;

        if (markersRef.current[sig.id]) {
          markersRef.current[sig.id].setLngLat([lng, lat])
          return
        }
        
        const el = document.createElement('div')
        el.className = 'flex items-center justify-center cursor-pointer group'
        el.innerHTML = `
          <div class="relative w-10 h-10 flex items-center justify-center bg-obsidian rounded-sm border border-white/20 shadow-2xl transition-all group-hover:scale-110 group-hover:border-gold/50">
             <div class="absolute inset-0 bg-gold/10 animate-[ping_2s_infinite] rounded-full scale-150 opacity-20 pointer-events-none"></div>
            <span class="text-lg relative z-10">${sig.moment_type === 'event' ? '📅' : '⚡'}</span>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full opacity-50 group-hover:opacity-100 glow-sm"></div>
          </div>
        `
        el.addEventListener('click', () => {
          setSelectedMoment(sig)
          setHasJoined(false)
        })

        const marker = new Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)
        markersRef.current[sig.id] = marker
      })
    }

    if (map.isStyleLoaded()) syncMarkers()
    else map.once('load', syncMarkers)
  }, [visibleMoments])

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
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-obsidian">
      {/* Map — Full Bleed */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* TOP LEFT — Search + Type Filter */}
      <div className="absolute top-[calc(76px+env(safe-area-inset-top))] lg:top-4 left-4 lg:left-[300px] flex flex-col gap-2 z-20 w-[220px] max-w-[calc(100vw-32px)] transition-all duration-500">
        {/* Search Box */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl"
          style={{ 
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)',
            borderLeft: '2px solid rgba(201,168,76,0.5)'
          }}
        >
          <Search className="w-4 h-4 text-white/60" strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="SEARCH / COORDINATES" 
            className="bg-transparent border-none outline-none font-mono text-[9px] text-white w-full uppercase tracking-widest placeholder:text-white/60"
          />
        </div>

        {/* ALL / MOMENTS / EVENTS Pills */}
        <div 
          className="flex gap-1 p-1.5 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl"
          style={{ 
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)',
            borderLeft: '2px solid rgba(201,168,76,0.5)'
          }}
        >
          {['ALL', 'MOMENTS', 'EVENTS'].map(f => (
            <button
              key={f}
              onClick={() => setMapFilter(f as any)}
              className={cn(
                "flex-1 py-2 rounded-lg text-[9px] tracking-widest uppercase transition-all duration-300",
                mapFilter === f 
                  ? "bg-gold/20 border border-gold/40 text-gold font-bold" 
                  : "text-white/55 hover:text-white/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TOP RIGHT — Live Indicator */}
      <div className="absolute top-[calc(76px+env(safe-area-inset-top))] lg:top-4 right-4 flex flex-col items-end gap-2 z-20">
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-white/75 text-[9px] tracking-[0.2em] uppercase font-bold">Live Radar</span>
        </div>
        
        <button 
          onClick={() => {
            if (mapRef.current && location) {
              mapRef.current.flyTo({ center: [location.longitude, location.latitude], zoom: 15, duration: 1500 })
            }
          }}
          className="w-10 h-10 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md flex items-center justify-center text-white/55 hover:text-gold transition-colors shadow-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}
        >
          <Crosshair className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* BOTTOM LEFT — Signal Count */}
      <div className="absolute bottom-[calc(100px+env(safe-area-inset-bottom))] lg:bottom-6 left-4 lg:left-[300px] z-20 transition-all duration-500">
        <div 
          className="px-5 py-3 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/60 text-[9px] tracking-[0.2em] uppercase mb-1 font-bold">Signals Intercepted</p>
          <p className="text-[#c9a84c] text-2xl font-bold tracking-wider text-shadow-glow">{visibleMoments.length}</p>
        </div>
      </div>

      {/* BOTTOM RIGHT — Radius Selector */}
      <div className="absolute bottom-[calc(100px+env(safe-area-inset-bottom))] lg:bottom-6 right-4 z-20">
        <div 
          className="flex flex-col gap-1 p-1.5 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl w-[90px]"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/20 text-[8px] tracking-[0.2em] uppercase text-center py-1 font-bold">Radius</p>
          {radiusOptions.map(r => (
            <button
              key={r}
              onClick={() => setMapRadius(r)}
              className={cn(
                "py-2 px-2 rounded-lg text-[9px] tracking-wider uppercase text-center transition-all duration-300",
                mapRadius === r 
                  ? "bg-gold/20 border border-gold/35 text-gold font-bold" 
                  : "text-white/55 hover:text-white/80"
              )}
            >
              {typeof r === 'number' ? `${r} km` : r}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM CENTER — Forum Label (Hidden on mobile) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex pb-[env(safe-area-inset-bottom)]">
        <div 
          className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/20 bg-[#0a0a14]/85 backdrop-blur-md shadow-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)' }}
        >
          <Radar className="w-4 h-4 text-gold animate-pulse" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="text-white/90 text-[13px] font-bold tracking-[0.25em] uppercase">FORUM</span>
            <span className="text-white/25 text-[8px] tracking-[0.15em] uppercase font-medium">Geospatial Intelligence</span>
          </div>
        </div>
      </div>

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-lg bg-crimson/10 border border-crimson/30 backdrop-blur-md">
          <Shield className="w-3 h-3 text-crimson-bright" />
          <span className="text-[9px] text-crimson-bright tracking-widest uppercase font-bold">Signal Interference / Position Unavailable</span>
        </div>
      )}

      {/* Moment Dossier Overlay */}
      <AnimatePresence>
        {selectedMoment && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md bg-void/80 pointer-events-auto"
              onClick={() => setSelectedMoment(null)}
            />
            <motion.article
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 pointer-events-auto flex flex-col overflow-hidden rounded-2xl shadow-2xl max-h-[85dvh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-[200px] md:h-[300px] w-full relative shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${selectedMoment.id}/1000/600`} 
                  className="w-full h-full object-cover grayscale contrast-125 opacity-70" 
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedMoment(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(201,168,76,0.8)]" />
                    <span className="text-[9px] text-gold/80 tracking-[0.3em] font-bold uppercase">Signal Dossier</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight leading-none">{selectedMoment.title}</h2>
                </div>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 border-b border-white/5 pb-10">
                  <div>
                    <p className="text-[9px] text-white/30 tracking-widest uppercase font-bold mb-2">Range</p>
                    <p className="font-mono text-lg text-white">
                      {location ? haversineKm(location.latitude, location.longitude, selectedMoment.latitude || 0, selectedMoment.longitude || 0).toFixed(2) : '---'} <span className="text-xs text-white/30">KM</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 tracking-widest uppercase font-bold mb-2">Entities</p>
                    <p className="font-mono text-lg text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-gold/60" /> {selectedMoment.participant_count ?? 0}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[9px] text-white/30 tracking-widest uppercase font-bold mb-2">Classification</p>
                    <span className="px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[9px] text-gold tracking-widest uppercase font-bold">
                      {selectedMoment.moment_type}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-white/50 font-medium mb-10 leading-relaxed uppercase tracking-[0.15em]">
                  {selectedMoment.description || "Active signal detected at coordinates. Local fluctuations indicate human gathering patterns. Metadata incomplete."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    disabled={isJoining || hasJoined}
                    onClick={handleJoinMoment}
                    className={cn(
                      "flex-1 px-8 py-5 text-[11px] tracking-[0.4em] font-black transition-all border rounded-xl shadow-xl",
                      hasJoined 
                        ? "bg-gold border-gold text-black scale-105" 
                        : "bg-white border-white text-black hover:bg-gold-pale hover:scale-[1.02]"
                    )}
                  >
                    {isJoining ? "SYCHRONIZING..." : hasJoined ? "CONNECTION ACTIVE" : "ENGAGE SIGNAL"}
                  </button>
                  <Link 
                    to={`/app/moment/${selectedMoment.id}`}
                    className="flex-1 px-8 py-5 text-[11px] tracking-[0.4em] font-black text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all text-center shadow-xl"
                  >
                    FULL RECORD
                  </Link>
                </div>
              </div>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      {/* Global Sector Scanning */}
      {momentsLoading && moments.length === 0 && (
        <div className="absolute inset-0 z-[200] bg-obsidian flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-[1px] bg-white/5 relative overflow-hidden">
               <motion.div 
                 animate={{ left: ['-100%', '100%'] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                 className="absolute top-0 bottom-0 w-1/2 bg-gold shadow-[0_0_15px_rgba(201,168,76,1)]"
               />
            </div>
            <motion.div
               animate={{ opacity: [0.3, 1, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="text-gold/40 text-[9px] tracking-[0.8em] font-bold uppercase"
            >
              Scanning Sectors
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
