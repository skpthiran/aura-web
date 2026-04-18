import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { createMoment } from '../lib/db/moments'
import { MOMENT_EXPIRY_HOURS, MAX_MOMENT_CAPACITY } from '../lib/constants'
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

  const handleSubmit = async () => {
    if (!location || !user) return
    setLoading(true)
    setError(null)
    
    try {
      const expiresAt = new Date(
        Date.now() + durationHours * 60 * 60 * 1000
      ).toISOString()
      
      await createMoment({
        title: title.trim(),
        description: description.trim() || undefined,
        lat: location.latitude,
        lng: location.longitude,
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
                {/* Moment Card */}
                <button
                  onClick={() => setMomentType('moment')}
                  className={cn(
                    "flex flex-col text-left p-6 rounded-2xl transition-all duration-300 border backdrop-blur-sm",
                    momentType === 'moment' 
                      ? "border-crimson/30 bg-crimson/5 shadow-[0_0_30px_rgba(220,20,60,0.1)]" 
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  )}
                >
                  <Zap className={cn("w-8 h-8 mb-4", momentType === 'moment' ? "text-crimson" : "text-gold/60")} />
                  <h3 className="font-serif text-2xl text-marble mb-1">Moment</h3>
                  <p className="micro-caps text-[10px] text-marble/40 mb-3 tracking-[0.2em]">SPONTANEOUS · EPHEMERAL</p>
                  <p className="text-sm text-marble/50 leading-relaxed font-light">
                    A real-time pulse. Appears on the map now, vanishes when the energy fades.
                  </p>
                </button>

                {/* Event Card */}
                <button
                  onClick={() => setMomentType('event')}
                  className={cn(
                    "flex flex-col text-left p-6 rounded-2xl transition-all duration-300 border backdrop-blur-sm",
                    momentType === 'event' 
                      ? "border-gold/30 bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.1)]" 
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  )}
                >
                  <Calendar className={cn("w-8 h-8 mb-4", momentType === 'event' ? "text-gold" : "text-gold/60")} />
                  <h3 className="font-serif text-2xl text-marble mb-1">Event</h3>
                  <p className="micro-caps text-[10px] text-marble/40 mb-3 tracking-[0.2em]">PLANNED · STRUCTURED</p>
                  <p className="text-sm text-marble/50 leading-relaxed font-light">
                    A scheduled gathering. Visible in advance, archived after completion.
                  </p>
                </button>
              </div>

              <button
                disabled={!momentType}
                onClick={() => setStep(2)}
                className="w-full bg-marble text-void py-4 rounded-xl micro-caps tracking-[0.2em] font-bold text-xs disabled:opacity-30 transition-all hover:bg-gold-pale flex items-center justify-center gap-2 group mt-8"
              >
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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

              {/* Title Input */}
              <div className="space-y-2">
                <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Signal Title</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's the vibe?"
                    className="w-full bg-void border-b border-white/10 py-3 px-1 text-marble text-lg outline-none focus:border-gold/50 transition-colors"
                  />
                  <span className="absolute right-0 bottom-3 text-[10px] font-mono text-marble/30">
                    {title.length} / 80
                  </span>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Description</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Set the tone..."
                    className="w-full bg-void border border-white/5 rounded-xl p-4 text-marble text-sm outline-none focus:border-gold/30 transition-colors resize-none mb-2"
                  />
                  <span className="absolute right-4 bottom-6 text-[10px] font-mono text-marble/30">
                    {description.length} / 500
                  </span>
                </div>
              </div>

              {/* Location Feedback */}
              <div className="space-y-2">
                <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Presence Status</label>
                <div className="glass-panel p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center bg-void border",
                    location ? "border-gold/20" : "border-crimson/20"
                  )}>
                    <MapPin className={cn("w-5 h-5", location ? "text-gold" : "text-crimson")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", location ? "text-marble" : "text-crimson")}>
                      {location ? "Using your current position" : "Location unavailable"}
                    </p>
                    {location && (
                      <p className="text-[10px] font-mono text-marble/40 mt-0.5">
                        LAT: {location.latitude.toFixed(4)} · LNG: {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Capacity Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Max Participants</label>
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
              <div className="space-y-4">
                <label className="micro-caps text-gold/60 text-[10px] tracking-[0.2em]">Signal Duration</label>
                <div className="flex gap-3">
                  {[2, 4, 6].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={cn(
                        "flex-1 py-3 rounded-lg micro-caps text-[11px] font-bold tracking-[0.15em] transition-all",
                        durationHours === hours
                          ? "bg-gold text-void shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                          : "glass-panel text-marble/60 hover:text-marble hover:bg-white/5"
                      )}
                    >
                      {hours}H
                    </button>
                  ))}
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
                disabled={loading || !title.trim() || !location}
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
