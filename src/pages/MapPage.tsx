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
  const [mapRadius, setMapRadius] = useState<number>(50000) // default 50km
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const radiusOptions = [
    { label: '5 KM', value: 5000 },
    { label: '50 KM', value: 50000 },
    { label: 'Province', value: 150000 },
    { label: 'Country', value: 500000 },
    { label: 'Global', value: 99999999 },
  ]
  const [mapFilter, setMapFilter] = useState<'All' | 'Moments' | 'Events'>('All')

  const { moments, loading: momentsLoading, refetch: refetchMoments, setMoments } = useNearbyMoments(location, mapRadius)
  const { addToast } = useToast()

  // Realtime Integration for Map
  const handleRealtimeInsert = useCallback((newMoment: Moment) => {
    // Sync state
    setMoments(prev => {
      const idx = prev.findIndex(m => m.id === newMoment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newMoment
        return next
      }
      return [newMoment, ...prev]
    })

    // Notify if nearby
    if (location && newMoment.latitude !== undefined && newMoment.longitude !== undefined) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        newMoment.latitude,
        newMoment.longitude
      )
      
      if (dist <= mapRadius) {
        addToast({
          title: newMoment.title,
          description: `Intercepted new ${newMoment.moment_type} at coordinates.`,
          link: `/app/moment/${newMoment.id}`,
          type: 'signal'
        })
      }
    }
  }, [location, mapRadius, addToast, setMoments])

  const handleRealtimeDelete = useCallback((id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
    setSelectedMoment(prev => prev?.id === id ? null : prev)
  }, [setMoments])

  useRealtimeMoments(handleRealtimeInsert, handleRealtimeDelete)

  // === SIGNAL FILTERING — NO .filter() TO AVOID TDZ ===
  const visibleMoments: Moment[] = []
  for (let idx = 0; idx < moments.length; idx++) {
    const sig = moments[idx]
    if (mapRadius < 99999999 && location) {
      const dKm = haversineKm(
        location.latitude, location.longitude,
        sig.latitude || sig.lat || 0, 
        sig.longitude || sig.lng || 0
      )
      if (dKm > mapRadius / 1000) continue
    }
    if (mapFilter === 'Moments' && sig.moment_type !== 'moment') continue
    if (mapFilter === 'Events' && sig.moment_type !== 'event') continue
    visibleMoments.push(sig)
  }
  // === END FILTERING ===

  // Radius Circle Visualization
  const updateRadiusCircle = useCallback(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    // Safe layer/source removal
    const safeRemove = () => {
      try {
        if (map.getLayer('radius-fill')) map.removeLayer('radius-fill')
        if (map.getLayer('radius-outline')) map.removeLayer('radius-outline')
        if (map.getSource('radius-source')) map.removeSource('radius-source')
      } catch {}
    }

    if (!location || mapRadius >= 99999999) {
      safeRemove()
      return
    }

    const radiusKm = mapRadius / 1000
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
  }, [location, mapRadius, mapLoaded])

  // New useEffect to call updateRadiusCircle
  useEffect(() => {
    updateRadiusCircle()
  }, [updateRadiusCircle])

  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const momentMarkersRef = useRef<Marker[]>([])

  const hasFlownToUser = useRef(false)

  // Initialize Map immediately with fallback
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: MAPTILER_STYLE,
      center: [79.8612, 6.9271], // Initialize at Colombo fallback
      zoom: 13,
      attributionControl: false,
      fadeDuration: 0,
      renderWorldCopies: false
    })

    mapRef.current = map
    map.on('load', () => setMapLoaded(true))

    const handleResize = () => mapRef.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Fly to user when location first becomes available
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


  // Sync User Location Marker
  useEffect(() => {
    if (!mapRef.current || !location) return

    // If marker doesn't exist, create it
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
      // Update position
      userMarkerRef.current.setLngLat([location.longitude, location.latitude])
    }
  }, [location])

  // Sync Moment Markers - OPTIMIZED VERSION
  const markersRef = useRef<{ [id: string]: Marker }>({})

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const syncMarkers = () => {
      const currentIds = new Set(visibleMoments.map(m => m.id))
      
      // Remove old markers
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      })

      // Add new markers
      visibleMoments.forEach(sig => {
        if (markersRef.current[sig.id]) {
          // Update position if needed (though moments shouldn't move much)
          const lon = sig.longitude || sig.lng || 0
          const lat = sig.latitude || sig.lat || 0
          markersRef.current[sig.id].setLngLat([lon, lat])
          return
        }
        
        const el = document.createElement('div')
        el.className = 'flex items-center justify-center cursor-pointer group'
        el.id = `marker-${sig.id}`
        
        const isEvent = sig.moment_type === 'event'
        // Add "new-signal-flash" class for animation
        el.innerHTML = `
          <div class="relative w-10 h-10 flex items-center justify-center bg-obsidian rounded-sm border border-white/20 shadow-2xl transition-all group-hover:scale-110 group-hover:border-gold/50">
             <div class="absolute inset-0 bg-gold/10 animate-[ping_2s_infinite] rounded-full scale-150 opacity-20 pointer-events-none"></div>
            <div class="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span class="text-lg relative z-10">${isEvent ? '📅' : '⚡'}</span>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full opacity-50 group-hover:opacity-100 glow-sm"></div>
          </div>
        `

        el.addEventListener('click', () => {
          setSelectedMoment(sig)
          setHasJoined(false)
        })

        const marker = new Marker({ element: el })
          .setLngLat([sig.lng, sig.lat])
          .addTo(map)
        
        markersRef.current[sig.id] = marker
      })
    }

    if (map.isStyleLoaded()) {
      syncMarkers()
    } else {
      map.once('load', syncMarkers)
    }
  }, [visibleMoments]) 


  const handleFlyToUser = () => {
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
      refetchMoments()
    } catch (err: any) {
      console.error('Failed to join moment:', err)
      alert(err.message ?? 'Failed to join signal')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-obsidian overflow-hidden">
      {/* MAP SECTION — Fixed 40vh on mobile, full-height desktop */}
      <div className="relative w-full lg:flex-1 shrink-0 h-[40vh] lg:h-full order-1 lg:order-2 border-b lg:border-l border-white/5">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        
        {/* Floating Controls — Keeping these but ensuring they are clean */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button 
            onClick={handleFlyToUser}
            className="w-10 h-10 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 active:scale-95 text-marble/60 hover:text-gold"
          >
            <Crosshair className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Location Alerts */}
        {locationError && (
          <div className="absolute top-4 left-4 z-20 glass-panel border-crimson/30 bg-crimson/5 px-4 py-2 flex items-center gap-3 animate-pulse">
            <Shield className="w-3 h-3 text-crimson-bright" />
            <span className="micro-caps text-crimson-bright text-[9px]">SIGNAL LOST</span>
          </div>
        )}
      </div>

      {/* PANEL SECTION — Remaining 60vh on mobile, sidebar on desktop */}
      <aside className="flex-1 lg:w-[400px] lg:h-full flex flex-col bg-obsidian z-20 order-2 lg:order-1 relative shadow-2xl overflow-hidden pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-6">
        {/* Background Grids */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        {/* Header content */}
        <div className="p-6 pb-2 shrink-0 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl text-marble tracking-widest uppercase text-shadow-glow">FORUM</h1>
              <span className="micro-caps text-[9px] text-gold-pale/50 hidden sm:inline">GEOSPATIAL INTELLIGENCE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="micro-caps text-[9px] text-gold/60">LIVE</span>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="glass-panel border-white/10 rounded-sm flex items-center px-4 py-3 relative overflow-hidden group mb-4">
            <div className="absolute inset-y-0 left-0 w-[2px] bg-gold" />
            <Search className="w-4 h-4 text-gold-pale/50 mr-3" strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="FILTER COORDINATES..." 
              className="bg-transparent border-none outline-none font-mono text-xs text-marble w-full uppercase tracking-wider placeholder:text-marble/20"
            />
          </div>

          {/* Filter Row 1: Signal Types */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide py-1">
            {['All', 'Moments', 'Events'].map(f => (
              <button
                key={f}
                onClick={() => setMapFilter(f as any)}
                className={cn(
                  "glass-panel hairline-all px-4 py-1.5 micro-caps text-[9px] transition-all duration-300 whitespace-nowrap",
                  mapFilter === f ? "bg-gold/20 text-gold border-gold/40" : "text-marble/40 hover:text-marble/70 hover:border-white/20"
                )}
              >
                {f}
              </button>
            ))}

            {/* Radius Dropdown (Moved into scroll row) */}
            <div className="h-6 w-[1px] bg-white/10 self-center mx-1" />
            {radiusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setMapRadius(opt.value)}
                className={cn(
                  'micro-caps text-[9px] px-3 py-1.5 rounded-sm whitespace-nowrap shrink-0 transition-all duration-300 border',
                  mapRadius === opt.value
                    ? 'bg-gold/90 border-gold text-void font-bold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-gold/30 hover:text-gold'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
             <p className="micro-caps text-[9px] text-marble/30 tracking-widest">{visibleMoments.length} SIGNALS INTERCEPTED</p>
             <div className="flex items-center gap-2">
                <Radar className="w-3 h-3 text-gold/40" />
                <span className="micro-caps text-[9px] text-marble/40">READY</span>
             </div>
          </div>
        </div>

        {/* Scrollable Signal List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-20 lg:pb-10 scrollbar-hide relative z-10">
          {visibleMoments.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-sm opacity-40">
              <Radar className="w-6 h-6 mb-2 text-marble/20" />
              <p className="micro-caps text-[9px]">NO SIGNALS IN SECTOR</p>
            </div>
          ) : (
            visibleMoments.map(sig => (
              <button 
                key={sig.id}
                onClick={() => {
                  setSelectedMoment(sig)
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [sig.longitude || 0, sig.latitude || 0],
                      zoom: 16,
                      essential: true
                    })
                  }
                }}
                className="w-full glass-panel border-white/5 p-3 flex items-start gap-4 hover:bg-white/5 active:scale-[0.98] transition-all text-left mb-2 group text-marble"
              >
                <div className="w-12 h-12 bg-white/5 shrink-0 overflow-hidden rounded-xs border border-white/10 group-hover:border-gold/30 transition-colors">
                  <img 
                    src={`https://picsum.photos/seed/${sig.id}/100/100`} 
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                    alt=""
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="micro-caps text-[8px] text-gold/60">{sig.moment_type}</span>
                    <span className="font-mono text-[8px] text-marble/30">
                      {location ? haversineKm(location.latitude, location.longitude, sig.latitude || 0, sig.longitude || 0).toFixed(1) : '??'}KM
                    </span>
                  </div>
                  <h3 className="text-marble font-medium text-[11px] truncate uppercase tracking-wider">{sig.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1 h-1 rounded-full bg-gold/50" />
                    <span className="text-marble/30 text-[9px] micro-caps">{sig.participant_count || 0} ENTS ACTIVE</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Moment Dossier Overlay */}
      <AnimatePresence>
        {selectedMoment && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md bg-void/80 pointer-events-auto"
              onClick={() => setSelectedMoment(null)}
            />
            
            <motion.article
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-card border border-white/10 pointer-events-auto flex flex-col overflow-hidden rounded-sm shadow-2xl max-h-[85dvh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-[180px] md:h-[260px] w-full relative shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${selectedMoment.id}/1000/600`} 
                  className="w-full h-full object-cover grayscale contrast-125" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedMoment(null)}
                  className="absolute top-4 right-4 w-10 h-10 glass-panel rounded-full flex items-center justify-center text-marble/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="micro-caps text-[9px] text-gold-pale mb-1 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gold rounded-full animate-pulse" /> Signal Dossier
                  </div>
                  <h2 className="font-serif text-2xl md:text-4xl text-marble tracking-tight">{selectedMoment.title}</h2>
                </div>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto scrollbar-hide">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 border-b border-white/5 pb-8">
                    <div>
                      <p className="micro-caps text-[9px] text-marble/30 mb-1">Range</p>
                      <p className="font-mono text-sm text-marble">
                        {location ? haversineKm(location.latitude, location.longitude, selectedMoment.latitude || 0, selectedMoment.longitude || 0).toFixed(2) : '---'} KM
                      </p>
                    </div>
                    <div>
                      <p className="micro-caps text-[9px] text-marble/30 mb-1">Entities</p>
                      <p className="font-mono text-sm text-marble flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gold/60" /> {selectedMoment.participant_count ?? 0}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="micro-caps text-[9px] text-marble/30 mb-1">Type</p>
                      <p className="micro-caps text-[10px] text-gold uppercase">{selectedMoment.moment_type}</p>
                    </div>
                 </div>

                 <p className="text-xs text-marble/50 font-light mb-8 leading-relaxed uppercase tracking-wider">
                   {selectedMoment.description || "Active signal detected at coordinates. Local fluctuations indicate human gathering patterns. Metadata incomplete."}
                 </p>

                 <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      disabled={isJoining || hasJoined}
                      onClick={handleJoinMoment}
                      className={cn(
                        "flex-1 px-8 py-4 micro-caps text-[10px] tracking-[0.3em] font-bold transition-all border",
                        hasJoined ? "bg-gold border-gold text-void" : "bg-marble border-marble text-void hover:bg-gold-pale"
                      )}
                    >
                      {isJoining ? "SYCHRONIZING..." : hasJoined ? "CONNECTION ACTIVE" : "ENGAGE SIGNAL"}
                    </button>
                    <Link 
                      to={`/app/moment/${selectedMoment.id}`}
                      className="px-8 py-4 micro-caps text-[10px] tracking-[0.3em] font-bold text-marble border border-white/10 hover:bg-white/5 text-center"
                    >
                      FULL RECORD
                    </Link>
                 </div>
              </div>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      {/* Global Loading */}
      {momentsLoading && moments.length === 0 && (
        <div className="absolute inset-0 z-[200] bg-obsidian flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-[2px] bg-gold/30 relative overflow-hidden">
               <motion.div 
                 animate={{ left: ['-100%', '100%'] }}
                 transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                 className="absolute top-0 bottom-0 w-1/2 bg-gold"
               />
            </div>
            <motion.div
               animate={{ opacity: [0.3, 1, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="text-gold/50 micro-caps text-[9px] tracking-[0.6em]"
            >
              SCANNING SECTORS
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
