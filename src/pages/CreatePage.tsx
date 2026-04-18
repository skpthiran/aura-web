import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { createMoment } from '../lib/db/moments'
import { MOMENT_EXPIRY_HOURS, MAX_MOMENT_CAPACITY, MAPTILER_STYLE } from '../lib/constants'
import { 
  MapPin, 
  Clock, 
  Users, 
  Tag, 
  Zap, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [momentType, setMomentType] = useState<'moment' | 'event' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(50)
  const [durationHours, setDurationHours] = useState(MOMENT_EXPIRY_HOURS)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
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

  const effectiveLat = customLat ?? location?.latitude ?? null
  const effectiveLng = customLng ?? location?.longitude ?? null

  useEffect(() => {
    if (step === 2 && mapPickerRef.current && !mapPickerInstance.current) {
      const timer = setTimeout(() => {
        if (!mapPickerRef.current) return
        
        const centerLat = location?.latitude ?? 6.9271
        const centerLng = location?.longitude ?? 79.8612
        
        const map = new MapLibreMap({
          container: mapPickerRef.current,
          style: MAPTILER_STYLE,
          center: [centerLng, centerLat],
          zoom: 14,
          attributionControl: false
        })
        
        mapPickerInstance.current = map
        
        // Force resize after style loads
        map.on('load', () => {
          map.resize()
          
          const el = document.createElement('div')
          el.style.cssText = `
            width: 20px;
            height: 20px;
            background: #d4af37;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(212,175,55,0.3);
            cursor: grab;
          `
          
          const marker = new Marker({ element: el, draggable: true })
            .setLngLat([centerLng, centerLat])
            .addTo(map)
          
          pickerMarkerRef.current = marker
          
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat()
            setCustomLat(lngLat.lat)
            setCustomLng(lngLat.lng)
          })
          
          map.on('click', (e) => {
            marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
            setCustomLat(e.lngLat.lat)
            setCustomLng(e.lngLat.lng)
          })
        })
      }, 300)

      return () => {
        clearTimeout(timer)
        if (mapPickerInstance.current) {
          mapPickerInstance.current.remove()
          mapPickerInstance.current = null
        }
        pickerMarkerRef.current = null
      }
    }
  }, [step, location])

  const handleSubmit = async () => {
    if (!effectiveLat || !effectiveLng || !user) return
    setLoading(true)
    setError(null)
    
    try {
      const expiresAt = new Date(
        Date.now() + durationHours * 60 * 60 * 1000
      ).toISOString()
      
      await createMoment({
        title: title.trim(),
        description: description.trim() || undefined,
        lat: effectiveLat,
        lng: effectiveLng,
        capacity_limit: capacity,
        expires_at: expiresAt,
        moment_type: momentType as 'moment' | 'event',
        tags
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
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-2xl mx-auto p-6 py-10">
        {/* Header */}
        <div className="mb-10 relative">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="absolute -left-12 top-1 text-marble/40 hover:text-marble transition-colors p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <p className="micro-caps text-gold mb-2">Create Signal</p>
          <h1 className="font-serif text-4xl text-marble tracking-tight">
            {step === 1 ? 'Choose Format' : 'Configure Signal'}
          </h1>
        </div>
        
        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ignite Moment Card */}
                <div 
                  onClick={() => {
                    setMomentType('moment')
                    setStep(2)
                  }}
                  className="group relative bg-obsidian border border-white/10 p-8 cursor-pointer overflow-hidden transition-all hover:border-crimson/40 hover:shadow-[0_0_40px_rgba(220,20,60,0.1)]"
                >
                  <div className="flex justify-between items-start mb-8">
                    <Zap className="w-8 h-8 text-crimson" />
                    <span className="micro-caps text-[10px] text-marble/20 tracking-[0.3em]">PROTOCOL 01</span>
                  </div>
                  
                  <h3 className="font-serif text-3xl text-marble mb-3">Ignite Moment</h3>
                  <p className="text-sm text-marble/40 leading-relaxed font-light mb-8">
                    EPHEMERAL BROADCAST. Visible to recipients in radius for 6 hours. Zero trace after dissipation.
                  </p>

                  <div className="flex items-center gap-2 micro-caps text-[10px] text-gold group-hover:gap-4 transition-all">
                    INITIALIZE <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Establish Event Card */}
                <div 
                  onClick={() => {
                    setMomentType('event')
                    setStep(2)
                  }}
                  className="group relative bg-obsidian border border-white/10 p-8 cursor-pointer overflow-hidden transition-all hover:border-gold/40 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)]"
                >
                  <div className="flex justify-between items-start mb-8">
                    <Calendar className="w-8 h-8 text-gold" />
                    <span className="micro-caps text-[10px] text-marble/20 tracking-[0.3em]">PROTOCOL 02</span>
                  </div>
                  
                  <h3 className="font-serif text-3xl text-marble mb-3">Establish Event</h3>
                  <p className="text-sm text-marble/40 leading-relaxed font-light mb-8">
                    STRUCTURED GATHERING. Persists in discovery feed. Ideal for curated collectives and summits.
                  </p>

                  <div className="flex items-center gap-2 micro-caps text-[10px] text-gold group-hover:gap-4 transition-all">
                    INITIALIZE <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {error && (
                <div className="p-4 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm flex items-center gap-3">
                  <Zap className="w-4 h-4 rotate-180" />
                  {error}
                </div>
              )}

              {/* Configuration Fields */}
              <div className="space-y-12">
                {/* Title Input */}
                <div className="space-y-4 pb-8 hairline-b">
                  <label className="micro-caps text-marble/40 text-[10px] tracking-[0.3em]">SIGNAL IDENTIFIER</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER SIGNAL TITLE..."
                      className="w-full bg-void/50 border border-white/10 rounded-xl py-4 px-6 text-marble text-lg outline-none focus:border-gold/50 transition-all placeholder:text-marble/20"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-marble/20">
                      {title.length} / 80
                    </span>
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-4 pb-8 hairline-b">
                  <label className="micro-caps text-marble/40 text-[10px] tracking-[0.3em]">CONTEXT & INTENT</label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ESTABLISH THE TONE..."
                      className="w-full bg-void/50 border border-white/10 rounded-xl p-6 text-marble text-sm outline-none focus:border-gold/30 transition-all resize-none placeholder:text-marble/20"
                    />
                    <span className="absolute right-6 bottom-6 text-[10px] font-mono text-marble/20">
                      {description.length} / 500
                    </span>
                  </div>
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-8 hairline-b">
                  {/* Capacity Slider */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="micro-caps text-marble/40 text-[10px] tracking-[0.3em]">CAPACITY LIMIT</label>
                      <span className="text-xl font-serif text-marble">{capacity}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max={MAX_MOMENT_CAPACITY}
                      step="1"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                  </div>

                  {/* Duration Selector */}
                  <div className="space-y-6">
                    <label className="micro-caps text-marble/40 text-[10px] tracking-[0.3em]">TEMPORAL DURATION</label>
                    <div className="flex gap-2">
                      {[2, 4, 6].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDurationHours(hours)}
                          className={cn(
                            "flex-1 py-3 rounded-xl micro-caps text-[10px] font-bold tracking-[0.2em] transition-all border",
                            durationHours === hours
                              ? "bg-gold text-void border-gold"
                              : "bg-void/50 text-marble/40 border-white/10 hover:border-white/20"
                          )}
                        >
                          {hours}H
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location Picker */}
                <div className="space-y-6 pb-8 hairline-b">
                  <label className="micro-caps text-marble/40 text-[10px] tracking-[0.3em]">GEOSPATIAL ANCHOR</label>
                  <div 
                    className="relative rounded-2xl overflow-hidden border border-white/10 bg-void/50 group"
                    style={{ height: '280px' }}
                  >
                    <div ref={mapPickerRef} className="w-full h-full" />
                    
                    {/* Coordinate Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 glass-panel px-4 py-3 rounded-xl border-white/5 flex justify-between items-center pointer-events-none">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] text-marble/20 micro-caps">Latitude</p>
                          <p className="text-xs font-mono text-gold">
                            {effectiveLat?.toFixed(6) ?? '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-marble/20 micro-caps">Longitude</p>
                          <p className="text-xs font-mono text-gold">
                            {effectiveLng?.toFixed(6) ?? '---'}
                          </p>
                        </div>
                      </div>
                      {customLat && (
                        <span className="micro-caps text-[10px] text-crimson animate-pulse">
                          CUSTOM OVERRIDE
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-marble/30 mt-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Tap map or drag marker to recalibrate anchor coordinates
                  </p>
                </div>
              </div>


              {/* Tags System */}
              <div className="space-y-4">
                <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Tags (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Enter keywords..."
                    className="flex-1 bg-void border border-white/10 rounded-lg px-4 py-2 text-sm text-marble outline-none focus:border-gold/30"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="px-4 bg-white/5 text-marble/60 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {tags.map((tag) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="hairline-all rounded-full px-3 py-1 micro-caps text-[9px] text-gold-pale bg-gold/5 flex items-center gap-1.5"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3 hover:text-marble transition-colors" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Submit Action */}
              <button
                disabled={loading || !title.trim() || !effectiveLat}
                onClick={handleSubmit}
                className="w-full bg-marble text-void py-5 rounded-xl micro-caps tracking-[0.2em] font-bold text-xs disabled:opacity-30 transition-all hover:bg-gold-pale flex items-center justify-center gap-3 group mt-12 mb-8 shadow-2xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Broadcast Signal
                    <Zap className="w-5 h-5 group-hover:scale-125 transition-transform text-void" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
