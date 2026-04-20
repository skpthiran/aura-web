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
  Info,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  Globe,
  Users
} from 'lucide-react'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'

// Import premium background assets
import momentBg from '../assets/moment-bg.png'
import eventBg from '../assets/event-bg.png'

const STEPS = [
  { id: 1, label: 'FORMAT', title: 'Choose Format' },
  { id: 2, label: 'NARRATIVE', title: 'Signal Details' },
  { id: 3, label: 'VECTOR', title: 'Geospatial Anchor' },
  { id: 4, label: 'GENESIS', title: 'Final Configuration' }
]

export default function CreatePage() {
  usePageTitle('Broadcast')
  const [step, setStep] = useState<number>(1)
  const [momentType, setMomentType] = useState<'moment' | 'event' | null>(null)
  
  // Step 2: Details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // Event Specific (Step 2)
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [venue, setVenue] = useState('')
  const [dresscode, setDresscode] = useState('')
  const [minAge, setMinAge] = useState<number | ''>('')
  const [maxAge, setMaxAge] = useState<number | ''>('')
  
  // Step 3: Location
  const [customLat, setCustomLat] = useState<number | null>(null)
  const [customLng, setCustomLng] = useState<number | null>(null)
  
  // Step 4: Settings
  const [capacity, setCapacity] = useState(50)
  const [isPrivate, setIsPrivate] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const { location } = useUserLocation()
  const navigate = useNavigate()

  const mapPickerRef = useRef<HTMLDivElement>(null)
  const mapPickerInstance = useRef<MapLibreMap | null>(null)
  const pickerMarkerRef = useRef<Marker | null>(null)
  const initialCoordsRef = useRef<{lat: number, lng: number} | null>(null)

  const effectiveLat = customLat ?? location?.latitude ?? null
  const effectiveLng = customLng ?? location?.longitude ?? null

  // Date constraints
  const now = new Date()
  const minDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)

  useEffect(() => {
    if (step !== 3) return
    
    // Initialize Map for Step 3
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
          el.className = 'w-6 h-6 bg-gold border-[3px] border-white rounded-full shadow-[0_0_0_8px_rgba(212,175,55,0.2)] cursor-grab transform transition-transform hover:scale-110 active:scale-95'
          
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
        // We don't reset initialCoordsRef here to keep position if user goes back/forth
      }
    }
  }, [step, location])

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
        expires_at: momentType === 'event' && endDateTime 
          ? new Date(endDateTime).toISOString() 
          : undefined,
        start_time: startDateTime ? new Date(startDateTime).toISOString() : undefined,
        end_time: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        venue: venue.trim() || undefined,
        is_private: isPrivate,
        dresscode: dresscode || undefined,
        age_min: minAge !== '' ? minAge : undefined,
        age_max: maxAge !== '' ? maxAge : undefined,
      })
      
      navigate('/app/map')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create signal')
      setStep(2) // Go back to details if it's a validation error usually
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

  const nextStep = () => {
    if (step === 1 && !momentType) return
    if (step === 2 && !title.trim()) {
       setError('Identification required')
       return
    }
    setError(null)
    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-void">
      <div className="max-w-4xl mx-auto p-6 py-8 md:py-16">
        
        {/* Progress System */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-[1px] bg-gold/50" />
                <p className="micro-caps text-gold tracking-[0.3em] text-[10px]">Signal Protocol</p>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl text-marble tracking-tight leading-tight">
                {STEPS[step - 1].title}
              </h1>
            </div>
            <div className="hidden md:flex gap-1">
              {STEPS.map((s) => (
                <div 
                  key={s.id} 
                  className={cn(
                    "w-8 h-1 rounded-full transition-all duration-500",
                    s.id === step ? "bg-gold w-12" : s.id < step ? "bg-gold/40" : "bg-white/10"
                  )} 
                />
              ))}
            </div>
          </div>
          
          <div className="flex md:hidden justify-between text-[8px] micro-caps text-marble/20 tracking-[0.2em]">
            {STEPS.map((s) => (
              <span key={s.id} className={cn(s.id === step && "text-gold")}>
                0{s.id}_{s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-8 p-4 rounded-2xl bg-crimson/5 border border-crimson/20 text-crimson-bright text-xs flex items-center gap-3">
                <Zap className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: TYPE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div 
                whileHover={{ y: -10 }}
                onClick={() => {
                  setMomentType('moment')
                  nextStep()
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
                    <span className="micro-caps text-[10px] text-marble/40 tracking-[0.4em]">EPHEMERAL</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl text-marble mb-4 group-hover:text-crimson-bright transition-colors">Ignite Moment</h3>
                    <p className="text-marble/50 font-light leading-relaxed mb-8">
                      Immediate broadcast. Visible to nearby recipients for 6 hours. Zero trace after dissipation.
                    </p>
                    <div className="flex items-center gap-3 micro-caps text-[10px] text-marble border-t border-white/10 pt-6 group-hover:text-gold transition-colors">
                      START BROADCAST <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10 }}
                onClick={() => {
                  setMomentType('event')
                  nextStep()
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
                    <span className="micro-caps text-[10px] text-marble/40 tracking-[0.4em]">STRUCTURED</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl text-marble mb-4 group-hover:text-gold transition-colors">Establish Event</h3>
                    <p className="text-marble/50 font-light leading-relaxed mb-8">
                      Future scheduled gathering. Perfect for summits, workshops, and galas.
                    </p>
                    <div className="flex items-center gap-3 micro-caps text-[10px] text-marble border-t border-white/10 pt-6 group-hover:text-gold transition-colors">
                      CONFIGURE SUMMIT <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12">
                <div className="space-y-10">
                  {/* Title */}
                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">
                       IDENTIFIER
                    </label>
                    <input
                      type="text"
                      autoFocus
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER SIGNAL TITLE..."
                      className="w-full bg-transparent border-b border-white/10 py-4 text-3xl md:text-5xl text-marble outline-none focus:border-gold transition-all placeholder:text-marble/5 font-serif"
                    />
                  </div>

                  {/* Narrative */}
                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">NARRATIVE</label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ESTABLISH CONTEXT..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-marble text-base md:text-lg outline-none focus:border-gold/30 transition-all resize-none placeholder:text-marble/10"
                    />
                  </div>
                  
                  {/* Taxonomy */}
                  <div className="space-y-4">
                    <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em]">TAXONOMY (MAX 5)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add keywords..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-marble outline-none focus:border-gold/30"
                      />
                      <button 
                        onClick={addTag} 
                        disabled={!tagInput.trim() || tags.length >= 5} 
                        className="px-6 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 disabled:opacity-30 transition-all flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="px-4 py-2 rounded-full bg-gold/5 border border-gold/20 text-[10px] micro-caps text-gold-pale flex items-center gap-3 group">
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="opacity-40 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3 hover:text-crimson-bright" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar (Event only or info) */}
                <div className="space-y-8">
                  {momentType === 'event' ? (
                    <div className="glass-panel p-6 rounded-3xl space-y-6">
                      <h4 className="micro-caps text-gold text-[10px] flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Event Parameters
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <p className="micro-caps text-[8px] text-marble/40">Window Open</p>
                           <input
                            type="datetime-local"
                            value={startDateTime}
                            min={minDate}
                            onChange={e => setStartDateTime(e.target.value)}
                            className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-marble text-xs outline-none focus:border-gold/50 [color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-2">
                           <p className="micro-caps text-[8px] text-marble/40">Window Close</p>
                           <input
                            type="datetime-local"
                            value={endDateTime}
                            min={startDateTime || minDate}
                            onChange={e => setEndDateTime(e.target.value)}
                            className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-marble text-xs outline-none focus:border-gold/50 [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                         <p className="micro-caps text-[8px] text-marble/40">Dress Code</p>
                         <div className="grid grid-cols-1 gap-2">
                          {['Smart Casual', 'Formal', 'Black Tie'].map(code => (
                            <button
                              key={code}
                              onClick={() => setDresscode(prev => prev === code ? '' : code)}
                              className={cn(
                                "text-[10px] micro-caps py-2 rounded-lg border transition-all text-left px-4",
                                dresscode === code ? "bg-gold/20 border-gold/50 text-gold" : "bg-white/5 border-white/5 text-marble/30 hover:text-marble/60"
                              )}
                            >
                              {code}
                            </button>
                          ))}
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel p-6 rounded-3xl bg-crimson/5 border-crimson/20">
                      <h4 className="micro-caps text-crimson-bright text-[10px] flex items-center gap-2 mb-4">
                        <Zap className="w-3 h-3" /> Ephemeral Mode
                      </h4>
                      <p className="text-[11px] text-marble/40 leading-relaxed font-light">
                        Ephemeral signals appear instantly and vanish exactly 6 hours after broadcast. Perfect for spontaneous meetups or live updates.
                      </p>
                    </div>
                  )}
                  
                  <div className="p-6 rounded-3xl border border-white/5 bg-white/2">
                    <h4 className="micro-caps text-marble/40 text-[10px] mb-4">Venue Identity</h4>
                    <input
                      type="text"
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      placeholder="Venue name..."
                      className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-marble text-xs outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <button onClick={prevStep} className="flex items-center gap-2 text-marble/40 hover:text-marble transition-colors micro-caps text-xs">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <button onClick={nextStep} className="bg-marble text-void px-10 py-5 rounded-2xl micro-caps font-bold transition-all hover:bg-gold-pale flex items-center gap-3">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LOCATION */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="relative rounded-[3rem] overflow-hidden border border-white/10 h-[500px] md:h-[600px] shadow-2xl">
                <div ref={mapPickerRef} className="absolute inset-0 bg-void" />
                
                {/* HUD Overlay */}
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
                  <div className="glass-panel p-6 rounded-3xl border-white/10 pointer-events-auto backdrop-blur-xl">
                    <p className="micro-caps text-gold text-[10px] mb-4 tracking-[0.2em]">VECTOR COORDINATES</p>
                    <div className="space-y-3 font-mono text-xl md:text-2xl text-marble tracking-tight">
                       <p className="flex items-center gap-4">
                         <span className="text-marble/20 text-xs micro-caps w-8">LAT</span>
                         {effectiveLat?.toFixed(6) ?? 'COORD_NULL'}
                       </p>
                       <p className="flex items-center gap-4">
                         <span className="text-marble/20 text-xs micro-caps w-8">LNG</span>
                         {effectiveLng?.toFixed(6) ?? 'COORD_NULL'}
                       </p>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block glass-panel p-6 rounded-3xl border-white/10 backdrop-blur-xl pointer-events-auto max-w-[240px]">
                    <div className="flex items-center gap-2 text-gold mb-3">
                      <Info className="w-4 h-4" />
                      <span className="micro-caps text-[10px]">Precision Sync</span>
                    </div>
                    <p className="text-[10px] text-marble/50 leading-relaxed font-light">
                      Drag the marker to calibrate the signal's origin. The map will synchronize with recipients in real-time.
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="glass-panel px-8 py-4 rounded-full border-gold/30 text-gold micro-caps text-[10px] tracking-[0.3em] backdrop-blur-md animate-pulse">
                    CALIBRATING GEOSPHERE_
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <button onClick={prevStep} className="flex items-center gap-2 text-marble/40 hover:text-marble transition-colors micro-caps text-xs">
                  <ChevronLeft className="w-4 h-4" /> Details
                </button>
                <button onClick={nextStep} className="bg-marble text-void px-10 py-5 rounded-2xl micro-caps font-bold transition-all hover:bg-gold-pale flex items-center gap-3">
                  Lock Vector <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: GENESIS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  {/* Capacity */}
                  <div className="space-y-8 glass-panel p-10 rounded-[2.5rem] border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <label className="micro-caps text-marble/30 text-[10px] tracking-[0.3em] block mb-1">INTENSITY</label>
                        <h4 className="micro-caps text-gold text-lg tracking-[0.1em]">Signal Capacity</h4>
                      </div>
                      <span className="text-5xl font-serif text-marble">{capacity}</span>
                    </div>
                    
                    <input
                      type="range"
                      min="2"
                      max={MAX_MOMENT_CAPACITY}
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold hover:accent-gold-pale transition-all"
                    />
                    
                    <div className="flex justify-between text-[10px] micro-caps text-marble/20 tracking-[0.2em]">
                      <span>MIN_2</span>
                      <span>MAX_500</span>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 flex items-center justify-between group cursor-pointer" onClick={() => setIsPrivate(!isPrivate)}>
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                        isPrivate ? "bg-gold/20 text-gold" : "bg-white/5 text-marble/20"
                      )}>
                        {isPrivate ? <Lock className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
                      </div>
                      <div>
                        <h4 className="font-serif text-2xl text-marble mb-1">{isPrivate ? 'Private Signal' : 'Public Discovery'}</h4>
                        <p className="text-[11px] micro-caps text-marble/30 tracking-[0.1em]">
                          {isPrivate ? 'Restricted to invitations' : 'Visible on the global grid'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-14 h-7 rounded-full relative transition-all duration-500",
                      isPrivate ? "bg-gold" : "bg-white/10"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-5 h-5 rounded-full bg-void transition-all duration-500",
                        isPrivate ? "left-8" : "left-1"
                      )} />
                    </div>
                  </div>
                </div>

                {/* Final Summary Card */}
                <div className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                   <div className="relative glass-panel rounded-[2.5rem] border-white/10 overflow-hidden bg-obsidian p-10 h-full flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start mb-10">
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                           {momentType === 'moment' ? <Zap className="w-6 h-6 text-crimson-bright" /> : <Calendar className="w-6 h-6 text-gold" />}
                         </div>
                         <div className="text-right">
                           <p className="micro-caps text-[8px] text-marble/40 tracking-[0.4em] mb-1">GENESIS_HASH</p>
                           <p className="font-mono text-[10px] text-gold/60 uppercase">AUR-{Math.random().toString(36).substring(7)}</p>
                         </div>
                       </div>
                       
                       <div className="space-y-6">
                         <p className="micro-caps text-[10px] text-gold tracking-[0.3em]">READY FOR BROADCAST</p>
                         <h2 className="font-serif text-4xl text-marble leading-tight">{title || 'Untitled Signal'}</h2>
                         <p className="text-sm text-marble/40 font-light leading-relaxed line-clamp-3">
                           {description || 'No narrative established for this signal.'}
                         </p>
                         
                         <div className="flex flex-wrap gap-2 pt-4">
                           {tags.map(t => <span key={t} className="text-[9px] micro-caps text-gold-pale/40">#{t}</span>)}
                           {tags.length === 0 && <span className="text-[9px] micro-caps text-marble/10">#GENERAL</span>}
                         </div>
                       </div>
                     </div>
                     
                     <div className="mt-12 space-y-4 border-t border-white/5 pt-8">
                        <div className="flex justify-between items-center text-xs micro-caps">
                           <span className="text-marble/30">CAPACITY</span>
                           <span className="text-marble">{capacity} RECIPIENTS</span>
                        </div>
                        <div className="flex justify-between items-center text-xs micro-caps">
                           <span className="text-marble/30">VISIBILITY</span>
                           <span className="text-marble">{isPrivate ? 'ENCRYPTED' : 'OPEN VECTOR'}</span>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Navigation & Submit */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                <button onClick={prevStep} className="flex items-center gap-2 text-marble/40 hover:text-marble transition-colors micro-caps text-xs order-2 md:order-1">
                  <ChevronLeft className="w-4 h-4" /> Vector Cal
                </button>
                
                <button
                  disabled={loading || !title.trim()}
                  onClick={handleSubmit}
                  className="w-full md:w-auto h-20 bg-marble text-void px-16 rounded-[2rem] micro-caps tracking-[0.3em] font-black text-sm disabled:opacity-20 transition-all hover:bg-gold-pale flex items-center justify-center gap-4 group relative overflow-hidden order-1 md:order-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-void" />
                  ) : (
                    <>
                      INITIALIZE BROADCAST
                      <div className="w-10 h-10 rounded-full bg-void flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5 text-marble group-hover:text-gold transition-colors" />
                      </div>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
