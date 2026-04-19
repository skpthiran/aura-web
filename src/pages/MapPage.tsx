import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAPTILER_STYLE } from '../lib/constants'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyMoments } from '../hooks/useNearbyMoments'
import { joinMoment } from '../lib/db/moments'
import { Crosshair, Search, Flame, Target, Users, Settings2, Target as Radar, Loader, Shield } from 'lucide-react'
import { cn } from '../lib/utils'
import { Moment } from '../types'
import { usePageTitle } from '../hooks/usePageTitle'

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

  const { moments, loading: momentsLoading, refetch: refetchMoments } = useNearbyMoments(location, mapRadius)

  // Combined Filtering: Type + Strict Radius
  const filteredMoments = moments.filter(m => {
    // 1. Filter by type
    if (mapFilter !== 'All') {
      const isEvent = m.moment_type === 'event'
      if (mapFilter === 'Moments' && isEvent) return false
      if (mapFilter === 'Events' && !isEvent) return false
    }
    
    // 2. Filter by strict radius
    if (mapRadius < 99999999 && location) {
      const distKm = haversineKm(
        location.latitude,
        location.longitude,
        m.lat,
        m.lng
      )
      if (distKm > (mapRadius / 1000)) return false
    }
    
    return true
  })

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
  const [mapFilter, setMapFilter] = useState<'All' | 'Moments' | 'Events'>('All')
  
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

  // Sync Moment Markers - ROBUST VERSION
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const syncMarkers = () => {
      // Clear old
      momentMarkersRef.current.forEach(m => m.remove())
      momentMarkersRef.current = []

      // Add new
      filteredMoments.forEach(m => {
        const el = document.createElement('div')
        el.className = 'flex items-center justify-center cursor-pointer group'
        el.id = `marker-${m.id}`
        
        const isEvent = m.moment_type === 'event'
        el.innerHTML = `
          <div class="relative w-10 h-10 flex items-center justify-center bg-obsidian rounded-sm border border-white/20 shadow-2xl transition-all group-hover:scale-110 group-hover:border-gold/50">
            <div class="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span class="text-lg relative z-10">${isEvent ? '📅' : '⚡'}</span>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full opacity-50 group-hover:opacity-100 glow-sm"></div>
          </div>
        `

        el.addEventListener('click', () => {
          setSelectedMoment(m)
          setHasJoined(false)
        })

        const marker = new Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map)
        
        momentMarkersRef.current.push(marker)
      })
    }

    // Handle style loading races
    if (map.isStyleLoaded()) {
      syncMarkers()
    } else {
      map.once('load', syncMarkers)
    }
  }, [filteredMoments, updateRadiusCircle])


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
    } catch (err) {
      console.error('Failed to join moment:', err)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-void" style={{ minHeight: '100dvh' }}>
      {/* Map Engine */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full" 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 hud-overlay mix-blend-multiply opacity-40" />
      </div>

      {/* Floating HUD Interface */}
      <div className="absolute top-6 lg:top-8 left-6 lg:left-8 right-6 lg:right-8 z-20 flex justify-between gap-4 md:gap-6 pointer-events-none items-start safe-area-pt">
        <div className="flex flex-col gap-3 pointer-events-auto w-full max-w-lg">
           <div className="flex items-center gap-3 md:gap-4 mb-1 md:mb-2">
             <h1 className="font-serif text-2xl md:text-4xl text-marble tracking-widest uppercase text-shadow-glow">FORUM</h1>
             <span className="micro-caps text-[9px] md:text-xs text-gold-pale/50 hidden sm:block">GEOSPATIAL INTELLIGENCE</span>
           </div>
           
           <div className="glass-panel border-white/10 rounded-sm flex items-center px-4 md:px-6 py-3 md:py-4 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 w-1 bg-gold transition-all duration-300 left-0" />
             <Search className="w-4 h-4 md:w-5 md:h-5 text-gold-pale/50 mr-3 md:mr-4 group-hover:text-gold transition-colors" strokeWidth={1.5} />
             <input 
               type="text" 
               placeholder="TARGET COORDINATES / EVENT SEARCH" 
               className="bg-transparent border-none outline-none font-mono text-[9px] md:text-[11px] text-marble w-full uppercase tracking-[0.15em] md:tracking-widest placeholder:text-marble/30"
             />
           </div>


            {locationError && (
               <div className="mt-2 md:mt-4 glass-panel border-crimson/30 bg-crimson/5 px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 md:gap-3 animate-pulse">
                 <Shield className="w-3.5 h-3.5 text-crimson-bright" />
                 <span className="micro-caps text-crimson-bright text-[9px] md:text-[10px]">Location access restricted.</span>
               </div>
            )}
        </div>

        <div className="flex flex-col gap-2 md:gap-3 pointer-events-auto">
          <button 
            onClick={handleFlyToUser}
            className="w-12 h-12 md:w-14 md:h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group"
          >
            <span className="absolute top-1 right-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Crosshair className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </button>
          <button className="w-12 h-12 md:w-14 md:h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group">
            <span className="absolute top-1 left-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Settings2 className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="absolute top-44 lg:top-48 left-6 lg:left-8 z-20 flex gap-2 pointer-events-auto">
        {['All', 'Moments', 'Events'].map(f => (
          <button
            key={f}
            onClick={() => setMapFilter(f as any)}
            className={cn(
              "glass-panel hairline-all px-5 py-2 micro-caps text-[10px] transition-all duration-300",
              mapFilter === f ? "bg-gold/20 text-gold border-gold/40" : "text-marble/40 hover:text-marble/70"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Radius Selector */}
      <div className="absolute bottom-40 lg:bottom-24 left-1/2 -translate-x-1/2 z-20
        flex items-center gap-2 overflow-x-auto scrollbar-hide
        max-w-[calc(100vw-40px)] pb-1">
        {radiusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setMapRadius(opt.value)}
            className={cn(
              'micro-caps text-xs px-4 py-2 rounded-full whitespace-nowrap shrink-0 transition-all duration-300',
              mapRadius === opt.value
                ? 'bg-gold text-void font-bold shadow-lg shadow-gold/30'
                : 'bg-black/70 backdrop-blur-md border border-white/30 text-white/70 hover:border-gold/50 hover:text-gold'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Moment Density Indicator */}
      <div className="absolute bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-panel border-white/5 px-4 md:px-6 py-2 flex items-center gap-3 md:gap-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold-pale animate-pulse" />
            <span className="micro-caps text-[9px] md:text-[10px] text-marble/60 tracking-[0.2em]">{filteredMoments.length} ACTIVE SIGNALS</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="micro-caps text-[9px] md:text-[10px] text-gold-pale tracking-[0.2em]">
            LIVE RADIUS: {mapRadius >= 99999999 ? 'GLOBAL' : `${mapRadius / 1000}KM`}
          </span>
        </div>
      </div>

      {/* Dossier Center Panel */}
      <AnimatePresence>
        {selectedMoment && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-6 md:p-12 pointer-events-none">
            <motion.div
              initial={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
              animate={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.4)" }}
              exit={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
              className="absolute inset-0 pointer-events-auto"
              onClick={() => setSelectedMoment(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-card border border-white/10 pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-t-[32px] md:rounded-sm max-h-[90dvh] md:max-h-none bottom-0 absolute md:relative mb-0 md:mb-0 safe-area-pb md:safe-area-pb-0"
              onClick={e => e.stopPropagation()}
            >
              {/* Corner Accents - Desktop Only */}
              <div className="hidden md:block absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/50" />
              <div className="hidden md:block absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/50" />
              <div className="hidden md:block absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/50" />
              <div className="hidden md:block absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/50" />
              
              {/* Mobile Handle */}
              <div className="md:hidden w-12 h-1 bg-white/10 rounded-full mx-auto my-4 shrink-0" />

              <div className="h-[200px] md:h-[280px] w-full relative shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${selectedMoment.id}/1000/600`} 
                  className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { 
                    e.currentTarget.style.opacity = '0'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent" />
                
                <div className="absolute top-6 md:top-8 left-6 md:left-8 right-6 md:right-8">
                  <div className="micro-caps text-[10px] text-gold-pale mb-2 md:mb-3 flex items-center gap-2">
                    <Radar className="w-3 h-3" /> Signal Intercepted
                  </div>
                  <Link to={`/app/moment/${selectedMoment.id}`}>
                    <h2 className="font-serif text-3xl md:text-5xl text-marble tracking-[-0.02em] leading-tight md:leading-normal hover:text-gold transition-colors cursor-pointer">{selectedMoment.title}</h2>
                  </Link>
                </div>
              </div>

              <div className="p-6 md:p-8 md:pb-10 bg-card border-t border-white/5 relative z-10 flex flex-col gap-6 md:gap-8 overflow-y-auto">
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 border-b border-white/5 pb-6 md:pb-8">
                    <div>
                      <p className="micro-caps text-[9px] md:text-[10px] text-marble/30 mb-1 md:mb-2 uppercase">Proximity</p>
                      <p className="font-mono text-xs md:text-sm tracking-wider text-marble uppercase">
                        {selectedMoment.distance_meters ? (selectedMoment.distance_meters / 1000).toFixed(2) : '0.00'} KM
                      </p>
                    </div>
                    <div>
                      <p className="micro-caps text-[9px] md:text-[10px] text-marble/30 mb-1 md:mb-2 uppercase">Heat Level</p>
                      <div className="font-mono text-xs md:text-sm tracking-wider text-crimson-bright flex items-center gap-1.5 md:gap-2">
                        <div className="w-1 h-2.5 md:h-3 bg-crimson-bright" />
                        <div className="w-1 h-2.5 md:h-3 bg-crimson-bright" />
                        <div className={cn("w-1 h-2.5 md:h-3", selectedMoment.participant_count && selectedMoment.participant_count > 10 ? "bg-crimson-bright" : "bg-crimson-bright/20")} />
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="micro-caps text-[9px] md:text-[10px] text-marble/30 mb-1 md:mb-2 uppercase">Entity Count</p>
                      <p className="font-mono text-xs md:text-sm tracking-wider text-marble flex items-center gap-2 uppercase">
                        <Users className="w-4 h-4" /> {selectedMoment.participant_count ?? 0} DETECTED
                      </p>
                    </div>
                 </div>

                 <p className="text-xs/relaxed md:text-sm/relaxed text-marble/60 font-light max-w-xl">
                   {selectedMoment.description || "A spontaneous gathering forming in the district. Signal density is varying but remains constant enough for engagement."}
                 </p>

                 <div className="pt-2 md:pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <button 
                      onClick={() => setSelectedMoment(null)} 
                      className="order-3 md:order-1 micro-caps text-[9px] md:text-xs text-marble/30 hover:text-marble transition-colors uppercase cursor-pointer text-center md:text-left py-2"
                    >
                      Close Interface
                    </button>
                    <Link 
                      to={`/app/moment/${selectedMoment.id}`}
                      className="order-2 micro-caps text-[9px] md:text-xs text-gold/60 hover:text-gold transition-colors uppercase text-center py-2 px-4 border border-gold/20 rounded-full"
                    >
                      View Signal Dossier
                    </Link>
                    <button 
                      disabled={isJoining || hasJoined}
                      onClick={handleJoinMoment}
                      className={cn(
                        "order-1 md:order-2 px-6 md:px-8 py-3 md:py-4 micro-caps text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] font-bold transition-all flex items-center justify-center gap-2 md:gap-3 relative overflow-hidden",
                        hasJoined ? "bg-gold text-void" : "bg-marble text-void hover:bg-gold-pale hover:shadow-[0_0_20px_rgba(243,229,171,0.3)]"
                      )}
                    >
                      {isJoining ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" /> ESTABLISHING...
                        </>
                      ) : hasJoined ? (
                        <>
                          <Target className="w-3.5 h-3.5" /> CONNECTION ACTIVE
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-3.5 h-3.5" /> Engage Signal
                        </>
                      )}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {momentsLoading && !moments.length && (
        <div className="absolute inset-0 z-50 bg-void flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gold blur-3xl opacity-20 animate-pulse" />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gold font-serif text-5xl tracking-[0.5em] relative z-10"
            >
              AURA
            </motion.div>
          </div>
          <div className="mt-8 micro-caps text-marble/40 animate-pulse">Synchronizing Geospatial Data</div>
        </div>
      )}
    </div>
  )
}
