import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { createMoment } from '../lib/db/moments'
import { MAX_MOMENT_CAPACITY, MAPTILER_STYLE } from '../lib/constants'
import { 
  MapPin, 
  Zap, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  X,
  Clock,
  Info
} from 'lucide-react'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'

// Import premium background assets
import momentBg from '../assets/moment-bg.png'
import eventBg from '../assets/event-bg.png'

export default function CreatePage() {
  usePageTitle('Broadcast')
  const [step, setStep] = useState<1 | 2>(1)
  const [momentType, setMomentType] = useState<'moment' | 'event' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(50)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const { location } = useUserLocation()
  const navigate = useNavigate()

  const [customLat, setCustomLat] = useState<number | null>(null)
  const [customLng, setCustomLng] = useState<number | null>(null)
  const mapPickerRef = useRef<HTMLDivElement>(null)
  const mapPickerInstance = useRef<MapLibreMap | null>(null)
  const pickerMarkerRef = useRef<Marker | null>(null)
  const initialCoordsRef = useRef<{lat: number, lng: number} | null>(null)

  const effectiveLat = customLat ?? location?.latitude ?? null
  const effectiveLng = customLng ?? location?.longitude ?? null

  // Date constraints for scheduling events
  const now = new Date()
  const minDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) // +1 hour
  const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // +30 days

  useEffect(() => {
    if (step === 1) {
      initialCoordsRef.current = null
    }
  }, [step])

  useEffect(() => {
    if (step !== 2) return
    
    // Store initial coords once — never update map position after init
    if (!initialCoordsRef.current) {
      initialCoordsRef.current = {
        lat: location?.latitude ?? 6.9271,
        lng: location?.longitude ?? 79.8612
      }
    }
    
    let map: MapLibreMap | null = null
    let initialized = false
    let attempts = 0
    const coords = initialCoordsRef.current
    
    const tryInit = () => {
      if (initialized) return
      attempts++
      const container = mapPickerRef.current
      if (!container) {
        if (attempts < 10) setTimeout(tryInit, 150)
        return
      }
      
      container.style.width = '100%'
      container.style.height = '260px'
      container.style.display = 'block'
      
      const rect = container.getBoundingClientRect()
      if (rect.width === 0) {
        if (attempts < 10) setTimeout(tryInit, 150)
        return
      }
      
      initialized = true
      
      try {
        map = new MapLibreMap({
          container,
          style: MAPTILER_STYLE,
          center: [coords.lng, coords.lat],
          zoom: 13,
          attributionControl: false,
          fadeDuration: 0,
          renderWorldCopies: false
        })
        
        mapPickerInstance.current = map
        
        map.on('load', () => {
          map!.resize()
          
          const el = document.createElement('div')
          el.style.cssText = `
            width: 22px;
            height: 22px;
            background: #d4af37;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 5px rgba(212,175,55,0.3);
            cursor: grab;
          `
          
          const marker = new Marker({ element: el, draggable: true })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map!)
          
          pickerMarkerRef.current = marker
          
          marker.on('dragend', () => {
            const ll = marker.getLngLat()
            setCustomLat(ll.lat)
            setCustomLng(ll.lng)
          })
          
          map!.on('click', (e) => {
            marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
            setCustomLat(e.lngLat.lat)
            setCustomLng(e.lngLat.lng)
          })
        })
      } catch(err) {
        console.error('Map init error:', err)
        initialized = false
      }
    }
    
    const timer = setTimeout(tryInit, 250)
    
    return () => {
      clearTimeout(timer)
      if (map) {
        map.remove()
        mapPickerInstance.current = null
        pickerMarkerRef.current = null
      }
    }
  }, [step])

  const handleSubmit = async () => {
    if (!effectiveLat || !effectiveLng || !user) return
    setLoading(true)
    setError(null)
    
    try {
      await createMoment({
        title: title.trim(),
        description: description.trim() || undefined,
        lat: effectiveLat,
        lng: effectiveLng,
        capacity_limit: capacity,
        moment_type: momentType as 'moment' | 'event',
        tags,
        expires_at: momentType === 'event' && expiresAt ? new Date(expiresAt).toISOString() : undefined
      })
      
      navigate('/app/map')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create signal')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-void">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="mb-12 relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-[1px] bg-gold/50" />
              <p className="micro-caps text-gold tracking-[0.3em] text-[10px]">Signal Protocol</p>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl text-marble tracking-tight leading-tight">
              {step === 1 ? 'Choose Format' : 'Configure Signal'}
            </h1>
          </div>
          
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 text-marble/40 hover:text-marble hover:border-white/30 transition-all bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="micro-caps text-[10px]">Change Format</span>
            </button>
          )}
        </div>
        
        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Ignite Moment Card */}
              <motion.div 
                whileHover={{ y: -10 }}
                onClick={() => {
                  setMomentType('moment')
                  setStep(2)
                }}
                className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden cursor-pointer group border border-white/5 hover:border-crimson/40 transition-colors shadow-2xl"
              >
                <img src={momentBg} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Moment Background" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                
                <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-crimson/20 border border-crimson/40 flex items-center justify-center backdrop-blur-md">
                      <Zap className="w-6 h-6 text-crimson-bright animate-pulse" />
                    </div>
                    <span className="micro-caps text-[10px] text-marble/40 tracking-[0.4em]">INIT_MOMENT</span>
                  </div>
                  
                  <div>
                    <h3 className="font-serif text-4xl text-marble mb-4 group-hover:text-crimson-bright transition-colors">Ignite Moment</h3>
                    <p className="text-marble/50 font-light leading-relaxed mb-8">
                      EPHEMERAL BROADCAST. Spontaneous and immediate. Visible to nearby recipients for 6 hours. Zero trace after dissipation.
                    </p>
                    <div className="flex items-center gap-3 micro-caps text-[10px] text-marble border-t border-white/10 pt-6 group-hover:text-gold transition-colors">
                      START BROADCAST <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Establish Event Card */}
              <motion.div 
                whileHover={{ y: -10 }}
                onClick={() => {
                  setMomentType('event')
                  setStep(2)
                }}
                className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden cursor-pointer group border border-white/5 hover:border-gold/40 transition-colors shadow-2xl"
              >
                <img src={eventBg} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Event Background" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                
                <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center backdrop-blur-md">
                      <Calendar className="w-6 h-6 text-gold" />
                    </div>
                    <span className="micro-caps text-[10px] text-marble/40 tracking-[0.4em]">INIT_EVENT</span>
                  </div>
                  
                  <div>
                    <h3 className="font-serif text-4xl text-marble mb-4 group-hover:text-gold transition-colors">Establish Event</h3>
                    <p className="text-marble/50 font-light leading-relaxed mb-8">
                      STRUCTURED GATHERING. Scheduled for the future. Persists in discovery. Perfect for summits, workshops, and galas.
                    </p>
                    <div className="flex items-center gap-3 micro-caps text-[10px] text-marble border-t border-white/10 pt-6 group-hover:text-gold transition-colors">
                      CONFIGURE SUMMIT <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {error && (
                <div className="p-4 rounded-2xl bg-crimson/5 border border-crimson/20 text-crimson-bright text-xs flex items-center gap-3 animate-shake">
                  <Zap className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Core Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em] flex items-center gap-2">
                       IDENTIFIER
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER SIGNAL TITLE..."
                      className="w-full bg-void/50 border-b border-white/10 py-4 text-xl md:text-2xl text-marble outline-none focus:border-gold transition-all placeholder:text-marble/10 font-serif"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">NARRATIVE</label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ESTABLISH CONTEXT..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-marble text-sm outline-none focus:border-gold/30 transition-all resize-none placeholder:text-marble/10"
                    />
                  </div>

                  {momentType === 'event' && (
                    <div className="space-y-4 p-6 rounded-2xl bg-gold/5 border border-gold/20">
                      <label className="micro-caps text-gold text-[10px] tracking-[0.3em] flex items-center gap-2">
                        <Clock className="w-3 h-3" /> TEMPORAL SCHEDULE
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full bg-void border border-gold/20 rounded-xl px-4 py-3 text-gold text-sm outline-none focus:border-gold transition-all"
                      />
                      <p className="text-[9px] text-gold-pale/40 italic">
                        * Scheduling available for the next 30 days
                      </p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">CAPACITY LIMIT</label>
                      <span className="text-xl font-serif text-marble">{capacity}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max={MAX_MOMENT_CAPACITY}
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">GEOSPATIAL ANCHOR</label>
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 h-[380px] group">
                      <div
                        ref={mapPickerRef}
                        style={{ 
                          width: '100%', 
                          height: '280px', 
                          display: 'block',
                          position: 'relative'
                        }}
                        className="rounded-xl overflow-hidden border border-white/10 h-[240px] md:h-[280px]"
                      />
                      <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-2xl border-white/10 flex justify-between items-center">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[8px] text-marble/20 micro-caps mb-1">LATITUDE</p>
                            <p className="text-xs font-mono text-gold leading-none">{effectiveLat?.toFixed(6) ?? '---'}</p>
                          </div>
                          <div className="w-[1px] h-6 bg-white/10" />
                          <div>
                            <p className="text-[8px] text-marble/20 micro-caps mb-1">LONGITUDE</p>
                            <p className="text-xs font-mono text-gold leading-none">{effectiveLng?.toFixed(6) ?? '---'}</p>
                          </div>
                        </div>
                        {customLat && <div className="w-2 h-2 rounded-full bg-crimson animate-pulse" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">TAXONOMY (MAX 5)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add keywords..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-marble outline-none focus:border-gold/30"
                      />
                      <button onClick={addTag} disabled={!tagInput.trim() || tags.length >= 5} className="px-5 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 disabled:opacity-30 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 rounded-full bg-gold/5 border border-gold/20 text-[10px] micro-caps text-gold-pale flex items-center gap-2">
                          #{tag}
                          <button onClick={() => removeTag(tag)}><X className="w-3 h-3 hover:text-marble" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <button
                disabled={loading || !title.trim() || !effectiveLat || (momentType === 'event' && !expiresAt)}
                onClick={handleSubmit}
                className="w-full h-16 md:h-20 bg-marble text-void rounded-2xl micro-caps tracking-[0.2em] md:tracking-[0.3em] font-bold text-xs md:text-sm disabled:opacity-20 transition-all hover:bg-gold-pale flex items-center justify-center gap-3 md:gap-4 group relative overflow-hidden"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    INITIALIZE BROADCAST
                    <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />
                  </>
                )}
                {!loading && (
                   <div className="absolute inset-x-0 bottom-0 h-1 bg-gold/30" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
