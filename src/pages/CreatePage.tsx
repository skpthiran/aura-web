import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { createMoment } from '../lib/db/moments'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  Zap, Calendar, MapPin, Users, ChevronRight,
  ChevronLeft, Check, Loader2, X, Clock, Lock,
  Music, Utensils, Palette, Dumbbell, Laptop,
  Heart, Sun, Moon, Coffee, Sparkles, Loader
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAPTILER_STYLE } from '../lib/constants'

const STEPS = [
  { num: 1, label: 'Type' },
  { num: 2, label: 'Details' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Capacity' },
]

const MOODS = [
  { icon: Music, label: 'Music', color: '#a78bfa' },
  { icon: Utensils, label: 'Food', color: '#f97316' },
  { icon: Palette, label: 'Art', color: '#ec4899' },
  { icon: Dumbbell, label: 'Sports', color: '#22c55e' },
  { icon: Laptop, label: 'Tech', color: '#3b82f6' },
  { icon: Heart, label: 'Social', color: '#ef4444' },
  { icon: Sun, label: 'Outdoor', color: '#eab308' },
  { icon: Moon, label: 'Nightlife', color: '#8b5cf6' },
  { icon: Coffee, label: 'Casual', color: '#a16207' },
  { icon: Sparkles, label: 'Culture', color: '#C9A84C' },
]

const TAG_SUGGESTIONS = [
  'music', 'food', 'art', 'sports', 'tech', 'social',
  'outdoor', 'nightlife', 'culture', 'wellness', 'fashion', 'film'
]

const DURATION_OPTIONS = [
  { label: '1h', hours: 1 },
  { label: '2h', hours: 2 },
  { label: '4h', hours: 4 },
  { label: '8h', hours: 8 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
]

const CAPACITY_PRESETS = [5, 10, 20, 50, 100, 200]

export default function CreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Create Signal')

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  // Form state
  const [momentType, setMomentType] = useState<'moment' | 'event'>('moment')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [durationHours, setDurationHours] = useState(4)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [venue, setVenue] = useState('')
  const [dresscode, setDresscode] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [capacityLimit, setCapacityLimit] = useState(20)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
    )
  }, [])

  const addTag = (tag: string) => {
    const t = tag.toLowerCase().trim().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 6) setTags(prev => [...prev, t])
    setTagInput('')
  }
  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const canProceed = () => {
    if (step === 1) return true
    if (step === 2) return title.trim().length >= 3
    if (step === 3) return latitude !== null && longitude !== null
    if (step === 4) return capacityLimit >= 1
    return false
  }

  const goNext = () => {
    if (!canProceed()) return
    setDirection(1)
    setStep(s => Math.min(4, s + 1))
  }

  const goPrev = () => {
    setDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    if (!user || !latitude || !longitude) return
    setSubmitting(true)
    setError(null)
    try {
      const expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString()
      const finalTags = selectedMood
        ? [...new Set([...tags, selectedMood.toLowerCase()])]
        : tags

      await createMoment({
        title: title.trim(),
        description: description.trim() || undefined,
        moment_type: momentType,
        lat: latitude,
        lng: longitude,
        tags: finalTags,
        capacity_limit: capacityLimit,
        expires_at: expiresAt,
        is_private: isPrivate,
        venue: venue.trim() || undefined,
        dresscode: dresscode.trim() || undefined,
        age_min: ageMin ? parseInt(ageMin) : undefined,
        age_max: ageMax ? parseInt(ageMax) : undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      })
      navigate('/app/today')
    } catch (e: any) {
      setError(e.message ?? 'Failed to create signal')
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  const detectLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Initialize map for Step 3
  useEffect(() => {
    if (step !== 3) return

    // Wait for DOM to paint before initializing
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return
      if (mapRef.current) {
        mapRef.current.resize()
        return
      }

      const defaultLat = latitude ?? 6.9271
      const defaultLng = longitude ?? 79.8612

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: MAPTILER_STYLE,
        center: [defaultLng, defaultLat],
        zoom: 14,
        attributionControl: false,
        fadeDuration: 0,
        renderWorldCopies: false,
      })

      map.on('load', () => {
        map.resize()

        const marker = new Marker({ color: '#C9A84C', draggable: true })
          .setLngLat([defaultLng, defaultLat])
          .addTo(map)

        markerRef.current = marker

        marker.on('dragend', () => {
          const ll = marker.getLngLat()
          setLatitude(ll.lat)
          setLongitude(ll.lng)
        })

        map.on('click', (e) => {
          marker.setLngLat(e.lngLat)
          setLatitude(e.lngLat.lat)
          setLongitude(e.lngLat.lng)
        })

        // Fly to real location if already detected
        if (latitude && longitude) {
          map.flyTo({ center: [longitude, latitude], zoom: 15, duration: 800 })
          marker.setLngLat([longitude, latitude])
        }
      })

      mapRef.current = map
    }, 300)

    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [step])

  // Fly to user location when detected
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !latitude || !longitude) return
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1000 })
    markerRef.current.setLngLat([longitude, latitude])
  }, [latitude, longitude])

  return (
    <div className="flex-1 overflow-y-auto bg-void">
      <div className="max-w-2xl mx-auto px-5 lg:px-8 pt-8 pb-28">

        {/* Header */}
        <div className="mb-6 text-center lg:text-left">
          <p className="micro-caps text-gold mb-1">New Signal</p>
          <h1 className="font-serif text-3xl lg:text-4xl text-marble">Create</h1>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center',
                  'text-xs font-medium transition-all duration-300',
                  step > s.num
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                    : step === s.num
                      ? 'bg-gold/20 border border-gold/50 text-gold'
                      : 'bg-white/5 border border-white/10 text-marble/25'
                )}>
                  {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span className={cn(
                  'micro-caps text-[9px]',
                  step === s.num ? 'text-gold' : 'text-marble/25'
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-px mb-4 transition-all duration-500',
                  step > s.num ? 'bg-green-500/30' : 'bg-white/8'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >

              {/* ── STEP 1: TYPE ── */}
              {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Moment */}
                  <button
                    onClick={() => setMomentType('moment')}
                    className={cn(
                      'text-left p-6 rounded-2xl border-2 transition-all duration-300',
                      momentType === 'moment'
                        ? 'border-red-500/60 bg-red-500/8'
                        : 'border-white/8 bg-white/3 hover:border-white/20'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
                      momentType === 'moment'
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-white/5 border border-white/10'
                    )}>
                      <Zap className={cn('w-5 h-5', momentType === 'moment' ? 'text-red-400' : 'text-marble/30')} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-marble font-medium">⚡ Moment</h3>
                      {momentType === 'moment' && (
                        <span className="micro-caps text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Selected</span>
                      )}
                    </div>
                    <p className="text-marble/40 text-sm leading-relaxed">
                      Spontaneous & ephemeral. A pulse in the city that lasts hours. Perfect for meetups and impromptu hangouts.
                    </p>
                  </button>

                  {/* Event */}
                  <button
                    onClick={() => setMomentType('event')}
                    className={cn(
                      'text-left p-6 rounded-2xl border-2 transition-all duration-300',
                      momentType === 'event'
                        ? 'border-gold/60 bg-gold/8'
                        : 'border-white/8 bg-white/3 hover:border-white/20'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
                      momentType === 'event'
                        ? 'bg-gold/20 border border-gold/30'
                        : 'bg-white/5 border border-white/10'
                    )}>
                      <Calendar className={cn('w-5 h-5', momentType === 'event' ? 'text-gold' : 'text-marble/30')} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-marble font-medium">◈ Event</h3>
                      {momentType === 'event' && (
                        <span className="micro-caps text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">Selected</span>
                      )}
                    </div>
                    <p className="text-marble/40 text-sm leading-relaxed">
                      Structured gathering with start time, venue, dress code & age gates. Built for curated experiences.
                    </p>
                  </button>
                </div>
              )}

              {/* ── STEP 2: DETAILS ── */}
              {step === 2 && (
                <div className="flex flex-col gap-5">

                  {/* Title */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-2 block">Signal Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={momentType === 'event' ? 'e.g. Rooftop Sundowner' : 'e.g. Coffee at the park'}
                      maxLength={80}
                      autoFocus
                      className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3.5
                        text-marble outline-none focus:border-gold/40 transition-all
                        placeholder:text-marble/20 text-base"
                    />
                    <p className="text-right text-marble/20 text-xs mt-1">{title.length}/80</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-2 block">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="What's the vibe? What should people expect?"
                      maxLength={300}
                      rows={3}
                      className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3
                        text-marble outline-none focus:border-gold/40 transition-all
                        placeholder:text-marble/20 text-base resize-none"
                    />
                  </div>

                  {/* Mood picker */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-3 block">Pick a Mood</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {MOODS.map(mood => (
                        <button
                          key={mood.label}
                          onClick={() => setSelectedMood(selectedMood === mood.label ? null : mood.label)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all',
                            selectedMood === mood.label
                              ? 'border-white/30 bg-white/8 shadow-lg'
                              : 'border-white/8 bg-white/3 hover:border-white/20'
                          )}
                          style={selectedMood === mood.label ? { borderColor: mood.color + '60', background: mood.color + '12' } : {}}
                        >
                          <mood.icon
                            className="w-4 h-4"
                            style={{ color: selectedMood === mood.label ? mood.color : 'rgba(255,255,255,0.25)' }}
                          />
                          <span className={cn(
                            'micro-caps text-[9px]',
                            selectedMood === mood.label ? 'text-marble' : 'text-marble/30'
                          )}>{mood.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-2 block">
                      Tags <span className="text-marble/20">(max 6)</span>
                    </label>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1.5 micro-caps text-xs px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold">
                            #{tag}
                            <button onClick={() => removeTag(tag)}><X className="w-3 h-3 opacity-60 hover:opacity-100" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).map(tag => (
                        <button key={tag} onClick={() => addTag(tag)}
                          className="micro-caps text-xs px-3 py-1.5 rounded-full bg-white/4 border border-white/10 text-marble/40 hover:border-gold/30 hover:text-gold transition-all">
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-2 block">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Signal Duration
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {DURATION_OPTIONS.map(opt => (
                        <button key={opt.hours} onClick={() => setDurationHours(opt.hours)}
                          className={cn(
                            'py-2.5 rounded-xl text-sm transition-all',
                            durationHours === opt.hours
                              ? 'bg-gold/15 border border-gold/40 text-gold font-medium shadow-sm'
                              : 'bg-white/4 border border-white/10 text-marble/50 hover:border-white/20'
                          )}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event-specific fields */}
                  {momentType === 'event' && (
                    <div className="flex flex-col gap-4 pt-4 border-t border-white/8">
                      <p className="micro-caps text-xs text-gold/60">Event Details</p>

                      {/* Start / End time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="micro-caps text-xs text-marble/40 mb-2 block">Start Time</label>
                          <input type="datetime-local" value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5
                              text-marble outline-none focus:border-gold/40 transition-all text-base [color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="micro-caps text-xs text-marble/40 mb-2 block">End Time</label>
                          <input type="datetime-local" value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5
                              text-marble outline-none focus:border-gold/40 transition-all text-base [color-scheme:dark]" />
                        </div>
                      </div>

                      {/* Venue */}
                      <div>
                        <label className="micro-caps text-xs text-marble/40 mb-2 block">Venue Name</label>
                        <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                          placeholder="e.g. Rooftop Bar, Central Park"
                          className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3
                            text-marble outline-none focus:border-gold/40 transition-all placeholder:text-marble/20 text-base" />
                      </div>

                      {/* Dress code + Age */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="micro-caps text-xs text-marble/40 mb-2 block">Dress Code</label>
                          <input type="text" value={dresscode} onChange={e => setDresscode(e.target.value)}
                            placeholder="e.g. Smart casual"
                            className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5
                              text-marble outline-none focus:border-gold/40 transition-all placeholder:text-marble/20 text-base" />
                        </div>
                        <div>
                          <label className="micro-caps text-xs text-marble/40 mb-2 block">Age Range</label>
                          <div className="flex items-center gap-1.5">
                            <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)}
                              placeholder="18" min="0" max="99"
                              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5
                                text-marble outline-none focus:border-gold/40 transition-all placeholder:text-marble/20 text-base" />
                            <span className="text-marble/20 text-xs shrink-0">–</span>
                            <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)}
                              placeholder="35" min="0" max="99"
                              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5
                                text-marble outline-none focus:border-gold/40 transition-all placeholder:text-marble/20 text-base" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: LOCATION ── */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <p className="text-marble/40 text-sm">
                    Drag the pin to set your exact signal location.
                  </p>

                  {/* MapLibre interactive map */}
                  <div className="rounded-2xl overflow-hidden border border-white/10 relative"
                    style={{ height: '320px' }}>
                    <div
                      ref={mapContainerRef}
                      style={{ width: '100%', height: '100%', minHeight: '320px' }}
                    />

                    {/* Center crosshair overlay */}
                    <div className="absolute inset-0 flex items-center justify-center
                      pointer-events-none z-10">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-gold border-2 border-white
                          shadow-lg shadow-gold/60" />
                        <div className="w-px h-4 bg-gold/60" />
                      </div>
                    </div>

                    {/* Locating spinner */}
                    {locating && (
                      <div className="absolute inset-0 flex items-center justify-center
                        bg-black/40 z-20 rounded-2xl">
                        <div className="flex flex-col items-center gap-2">
                          <Loader className="w-6 h-6 text-gold animate-spin" />
                          <p className="micro-caps text-xs text-marble/60">Detecting location...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coordinates display */}
                  <div className={cn(
                    'rounded-2xl border transition-all duration-300 p-4',
                    latitude ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/3'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        latitude ? 'bg-green-500/15 border border-green-500/25' : 'bg-white/5 border border-white/10'
                      )}>
                        <MapPin className={cn('w-4 h-4', latitude ? 'text-green-400' : 'text-marble/30')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-marble text-sm font-medium">
                          {locating ? 'Detecting...' : latitude ? 'Location locked' : 'Location required'}
                        </p>
                        {latitude && longitude && (
                          <p className="text-marble/35 text-xs mt-0.5 font-mono">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      {latitude && !locating && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      {locating && <Loader className="w-4 h-4 text-gold animate-spin shrink-0" />}
                    </div>

                    {!latitude && !locating && (
                      <button onClick={detectLocation}
                        className="w-full mt-3 py-2.5 rounded-xl micro-caps text-sm
                          bg-gold/10 border border-gold/30 text-gold hover:bg-gold/15 transition-all">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Detect My Location
                      </button>
                    )}
                  </div>

                  {/* Privacy toggle */}
                  <div className="flex items-center justify-between
                    bg-white/4 border border-white/10 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-marble/30" />
                      <div>
                        <p className="text-marble text-sm">Private Signal</p>
                        <p className="text-marble/30 text-xs mt-0.5">Only visible via direct link</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPrivate(p => !p)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-all duration-300 relative shrink-0',
                        isPrivate ? 'bg-gold' : 'bg-white/10'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300',
                        isPrivate ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: CAPACITY ── */}
              {step === 4 && (
                <div className="flex flex-col gap-5">
                  <p className="text-marble/40 text-sm">Set how many people can join your signal.</p>

                  {/* Presets */}
                  <div>
                    <label className="micro-caps text-xs text-marble/40 mb-3 block">Quick select</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                      {CAPACITY_PRESETS.map(cap => (
                        <button key={cap} onClick={() => setCapacityLimit(cap)}
                          className={cn(
                            'py-3 rounded-xl font-serif text-xl transition-all',
                            capacityLimit === cap
                              ? 'bg-gold/15 border border-gold/40 text-gold'
                              : 'bg-white/4 border border-white/10 text-marble/50 hover:border-white/20'
                          )}>
                          {cap}
                        </button>
                      ))}
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => setCapacityLimit(c => Math.max(1, c - 1))}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-marble/60 hover:text-marble transition-colors flex items-center justify-center text-xl">−</button>
                      <input type="number" value={capacityLimit}
                        onChange={e => setCapacityLimit(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center bg-white/4 border border-white/10 rounded-xl py-3 text-marble font-serif text-3xl outline-none focus:border-gold/40 transition-all font-bold" />
                      <button onClick={() => setCapacityLimit(c => c + 1)}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-marble/60 hover:text-marble transition-colors flex items-center justify-center text-xl">+</button>
                    </div>
                    <p className="text-center micro-caps text-xs text-marble/25 mt-2">{capacityLimit} {capacityLimit === 1 ? 'person' : 'people'} max</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                    <p className="micro-caps text-xs text-marble/35 mb-4">Signal Summary</p>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Type', value: momentType === 'event' ? '◈ Event' : '⚡ Moment' },
                        { label: 'Title', value: title || '—' },
                        { label: 'Mood', value: selectedMood || '—' },
                        { label: 'Duration', value: `${durationHours}h` },
                        { label: 'Capacity', value: `${capacityLimit} people` },
                        { label: 'Location', value: latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : '—' },
                        { label: 'Private', value: isPrivate ? 'Yes' : 'No' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="micro-caps text-xs text-marble/30">{row.label}</span>
                          <span className="text-marble text-sm truncate max-w-[200px] text-right font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm px-1 font-medium">{error}</p>}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 mt-8">
          {step > 1 && (
            <button onClick={goPrev}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-marble/60 hover:text-marble transition-all micro-caps text-sm">
              <ChevronLeft className="w-4 h-4" />Back
            </button>
          )}

          {step < 4 ? (
            <button onClick={goNext} disabled={!canProceed()}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl micro-caps text-sm font-medium transition-all',
                canProceed()
                  ? 'bg-marble text-void hover:bg-gold shadow-lg shadow-gold/10'
                  : 'bg-white/5 text-marble/25 cursor-not-allowed border border-white/8'
              )}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !latitude}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl micro-caps text-sm font-bold transition-all',
                submitting || !latitude
                  ? 'bg-white/5 text-marble/25 cursor-not-allowed border border-white/8'
                  : 'bg-gold text-void hover:bg-gold/80 shadow-lg shadow-gold/20'
              )}>
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Dropping Signal...</>
                : <><Zap className="w-4 h-4 shrink-0" />Drop Signal</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
