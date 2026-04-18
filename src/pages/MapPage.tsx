import { useEffect, useRef, useState } from 'react'
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

export default function MapPage() {
  const { location, error: locationError } = useUserLocation()
  const { moments, loading: momentsLoading, refetch: refetchMoments } = useNearbyMoments(location)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const momentMarkersRef = useRef<Marker[]>([])

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: MAPTILER_STYLE,
      center: location ? [location.longitude, location.latitude] : [79.8612, 6.9271], // Falling back to Colombo
      zoom: 14,
      attributionControl: false
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

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

  // Sync Moment Markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    momentMarkersRef.current.forEach(m => m.remove())
    momentMarkersRef.current = []

    // Add new markers
    moments.forEach(moment => {
      const el = document.createElement('div')
      el.className = 'moment-marker relative group cursor-pointer'
      
      const isEvent = moment.moment_type === 'event'
      const color = isEvent ? 'rgba(212,175,55,0.9)' : 'rgba(139,0,0,0.9)'
      const borderColor = isEvent ? '#d4af37' : '#ff0800'
      const icon = isEvent ? 
        `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>` : 
        `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`

      el.style.width = '48px'
      el.style.height = '48px'
      el.style.backgroundColor = color
      el.style.border = `1px solid ${borderColor}`
      el.style.borderRadius = '4px'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.boxShadow = `0 0 15px ${color}`
      el.innerHTML = icon

      el.addEventListener('click', () => {
        setSelectedMoment(moment)
        setHasJoined(false)
      })

      const marker = new Marker({ element: el })
        .setLngLat([moment.lng, moment.lat])
        .addTo(mapRef.current!)
      
      momentMarkersRef.current.push(marker)
    })
  }, [moments])

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
    <div className="flex-1 flex relative w-full h-[100dvh] md:h-auto overflow-hidden bg-void">
      {/* Map Engine */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      
      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 hud-overlay mix-blend-multiply opacity-40" />
      </div>

      {/* Floating HUD Interface */}
      <div className="absolute top-8 left-8 right-8 z-20 flex justify-between gap-6 pointer-events-none items-start">
        <div className="flex flex-col gap-3 pointer-events-auto w-full max-w-lg">
           <div className="flex items-center gap-4 mb-2">
             <h1 className="font-serif text-3xl md:text-4xl text-marble tracking-widest uppercase text-shadow-glow">FORUM</h1>
             <span className="micro-caps text-gold-pale/50 hidden md:block">GEOSPATIAL INTELLIGENCE</span>
           </div>
           
           <div className="glass-panel border-white/10 rounded-sm flex items-center px-6 py-4 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 w-1 bg-gold transition-all duration-300 left-0" />
             <Search className="w-5 h-5 text-gold-pale/50 mr-4 group-hover:text-gold transition-colors" strokeWidth={1.5} />
             <input 
               type="text" 
               placeholder="TARGET COORDINATES / EVENT SEARCH" 
               className="bg-transparent border-none outline-none font-mono text-[11px] text-marble w-full uppercase tracking-widest placeholder:text-marble/30"
             />
           </div>

           {locationError && (
              <div className="mt-4 glass-panel border-crimson/30 bg-crimson/5 px-4 py-2 flex items-center gap-3 animate-pulse">
                <Shield className="w-4 h-4 text-crimson-bright" />
                <span className="micro-caps text-crimson-bright text-[10px]">Location access restricted. Intelligence degraded.</span>
              </div>
           )}
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <button 
            onClick={handleFlyToUser}
            className="w-14 h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group"
          >
            <span className="absolute top-1 right-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Crosshair className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button className="w-14 h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group">
            <span className="absolute top-1 left-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Settings2 className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Moment Density Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-panel border-white/5 px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold-pale animate-pulse" />
            <span className="micro-caps text-[10px] text-marble/60 tracking-[0.2em]">{moments.length} ACTIVE SIGNALS</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="micro-caps text-[10px] text-gold-pale tracking-[0.2em]">LIVE RADIUS: 2.0KM</span>
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-card border border-white/10 pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-sm"
              onClick={e => e.stopPropagation()}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/50" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/50" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/50" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/50" />

              <div className="h-[280px] w-full relative">
                <img 
                  src={`https://picsum.photos/seed/${selectedMoment.id}/1000/600`} 
                  className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent" />
                
                <div className="absolute top-8 left-8">
                  <div className="micro-caps text-gold-pale mb-3 flex items-center gap-2">
                    <Radar className="w-3 h-3" /> Signal Intercepted
                  </div>
                  <h2 className="font-serif text-5xl text-marble tracking-[-0.02em]">{selectedMoment.title}</h2>
                </div>
              </div>

              <div className="p-8 pb-10 bg-card border-t border-white/5 relative z-10 flex flex-col gap-8">
                 
                 <div className="grid grid-cols-3 gap-6 border-b border-white/5 pb-8">
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Proximity</p>
                      <p className="font-mono text-sm tracking-wider text-marble">
                        {selectedMoment.distance_meters ? (selectedMoment.distance_meters / 1000).toFixed(2) : '0.00'} KM
                      </p>
                    </div>
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Heat Level</p>
                      <p className="font-mono text-sm tracking-wider text-crimson-bright flex items-center gap-2">
                        <div className="w-1 h-3 bg-crimson-bright" />
                        <div className="w-1 h-3 bg-crimson-bright" />
                        <div className={cn("w-1 h-3", selectedMoment.participant_count && selectedMoment.participant_count > 10 ? "bg-crimson-bright" : "bg-crimson-bright/20")} />
                      </p>
                    </div>
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Entity Count</p>
                      <p className="font-mono text-sm tracking-wider text-marble flex items-center gap-2">
                        <Users className="w-4 h-4" /> {selectedMoment.participant_count ?? 0} DETECTED
                      </p>
                    </div>
                 </div>

                 <p className="text-sm/relaxed text-marble/60 font-light max-w-xl">
                   {selectedMoment.description || "A spontaneous gathering forming in the district. Signal density is varying but remains constant enough for engagement."}
                 </p>

                 <div className="pt-4 flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedMoment(null)} 
                      className="micro-caps text-marble/40 hover:text-marble transition-colors uppercase cursor-pointer"
                    >
                      Close Interface
                    </button>
                    <button 
                      disabled={isJoining || hasJoined}
                      onClick={handleJoinMoment}
                      className={cn(
                        "px-8 py-4 micro-caps tracking-[0.3em] font-bold transition-all flex items-center gap-3 relative overflow-hidden",
                        hasJoined ? "bg-gold text-void" : "bg-marble text-void hover:bg-gold-pale hover:shadow-[0_0_20px_rgba(243,229,171,0.3)]"
                      )}
                    >
                      {isJoining ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> ESTABLISHING...
                        </>
                      ) : hasJoined ? (
                        <>
                          <Target className="w-4 h-4" /> CONNECTION ACTIVE
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-4 h-4" /> Engage Signal
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
