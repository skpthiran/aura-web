import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Zap, Map, Calendar, ArrowRight, X } from 'lucide-react'
import { cn } from '../lib/utils'

const SLIDES = [
  {
    id: 'signals',
    icon: Zap,
    iconColor: '#ef4444',
    iconBg: 'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.25)',
    badge: '⚡ Moments',
    title: 'Drop a Signal\ninto the City.',
    desc: 'Create spontaneous moments that pulse on the map in real-time. They expire in hours — not days. Be there or miss it forever.',
    hint: 'Ephemeral by design',
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.18) 0%, transparent 70%)',
  },
  {
    id: 'map',
    icon: Map,
    iconColor: '#C9A84C',
    iconBg: 'rgba(201,168,76,0.12)',
    iconBorder: 'rgba(201,168,76,0.25)',
    badge: '📍 Live Map',
    title: 'See What\'s\nHappening Now.',
    desc: 'Every active signal appears on a live map within your radius. Explore the city like never before — hyperlocal discovery in real time.',
    hint: 'Within 5KM of you',
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.15) 0%, transparent 70%)',
  },
  {
    id: 'events',
    icon: Calendar,
    iconColor: '#a78bfa',
    iconBg: 'rgba(167,139,250,0.12)',
    iconBorder: 'rgba(167,139,250,0.25)',
    badge: '◈ Events',
    title: 'Curated\nExperiences.',
    desc: 'Host structured gatherings with venue details, dress codes, start times, and age gates. Built for memorable, intentional nights.',
    hint: 'Invite only or open',
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.15) 0%, transparent 70%)',
  },
]

const STORAGE_KEY = 'aura_onboarding_complete'

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [exiting, setExiting] = useState(false)

  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  const goNext = () => {
    if (isLast) {
      handleComplete()
      return
    }
    setDirection(1)
    setSlide(s => s + 1)
  }

  const goPrev = () => {
    if (slide === 0) return
    setDirection(-1)
    setSlide(s => s - 1)
  }

  const handleComplete = () => {
    setExiting(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    setTimeout(onComplete, 400)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: '#08080f' }}
    >
      {/* Background gradient per slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '_bg'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: current.gradient }}
        />
      </AnimatePresence>

      {/* Skip button */}
      <button
        onClick={handleComplete}
        className="absolute top-6 right-6 flex items-center gap-1.5
          text-xs text-white/25 hover:text-white/50 transition-colors
          micro-caps tracking-widest"
      >
        Skip <X className="w-3 h-3" />
      </button>

      {/* Slide content */}
      <div className="relative w-full max-w-sm px-8 flex flex-col items-center text-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center"
          >
            {/* Icon */}
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
              style={{
                background: current.iconBg,
                border: `1px solid ${current.iconBorder}`,
                boxShadow: `0 0 60px ${current.iconBg}`,
              }}
            >
              <current.icon className="w-10 h-10" style={{ color: current.iconColor }} />
            </div>

            {/* Badge */}
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full
                border mb-6 micro-caps text-xs"
              style={{
                borderColor: current.iconBorder,
                background: current.iconBg,
                color: current.iconColor,
              }}
            >
              {current.badge}
            </div>

            {/* Title */}
            <h2
              className="font-serif text-white leading-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 8vw, 2.75rem)', whiteSpace: 'pre-line' }}
            >
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              {current.desc}
            </p>

            {/* Hint pill */}
            <div className="flex items-center gap-2 micro-caps text-xs text-white/20">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              {current.hint}
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col items-center gap-6">

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setDirection(i > slide ? 1 : -1)
                setSlide(i)
              }}
              className="transition-all duration-300"
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? '24px' : '6px',
                  height: '6px',
                  background: i === slide ? current.iconColor : 'rgba(255,255,255,0.15)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 w-full max-w-sm">
          {slide > 0 && (
            <button
              onClick={goPrev}
              className="px-5 py-3.5 rounded-2xl text-sm text-white/40
                bg-white/5 border border-white/10 hover:text-white
                transition-all micro-caps"
            >
              Back
            </button>
          )}

          <button
            onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2
              py-4 rounded-2xl text-sm font-medium transition-all duration-300
              micro-caps"
            style={{
              background: isLast ? current.iconColor : 'white',
              color: '#08080f',
              boxShadow: isLast ? `0 20px 60px ${current.iconBg}` : 'none',
            }}
          >
            {isLast ? 'Enter Aura' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Helper — call this to check if onboarding is needed
export function needsOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEY)
}
