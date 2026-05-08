import { type ReactElement, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import {
  Activity,
  ArrowRight,
  Clock,
  Compass,
  Eye,
  Flame,
  Map,
  MapPin,
  Terminal,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '../lib/utils'

type FloatingCapsule = {
  text: string
  x: string
  y: string
  delay: number
  colorClass: string
}

type LayerCard = {
  id: number
  name: string
  z: number
  colorClass: string
  icon: LucideIcon
}

type SignalMode = {
  title: string
  image: string
  examples: readonly string[]
  description: string
  overlayClass: string
  accentBarClass: string
  delay: number
}

type ProcessStep = {
  title: string
  icon: LucideIcon
}

type PsychologyBlock = {
  title: string
  description: string
  icon: LucideIcon
  colorClass: string
}

const HERO_BG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2622&auto=format&fit=crop'
const CITY_BG = 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2564&auto=format&fit=crop'
const NIGHT_WALK = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop'
const EVENT_BG = 'https://images.unsplash.com/photo-1516961642265-531546e84af2?q=80&w=2000&auto=format&fit=crop'
const PULSE_MAP = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop'

const FLOATING_CAPSULES: readonly FloatingCapsule[] = [
  { text: 'Rooftop session · 2.1km', x: '15%', y: '30%', delay: 0.2, colorClass: 'from-amber-500 to-amber-700' },
  { text: 'Late-night walk · 800m', x: '75%', y: '45%', delay: 0.4, colorClass: 'from-cyan-400 to-cyan-600' },
  { text: 'Vinyl drop · 48m left', x: '20%', y: '65%', delay: 0.6, colorClass: 'from-violet-500 to-violet-700' },
  { text: '12 joined nearby', x: '70%', y: '75%', delay: 0.8, colorClass: 'from-crimson-500 to-crimson-700' },
]

const LAYER_CARDS: readonly LayerCard[] = [
  { id: 1, name: 'Expiry', z: 160, colorClass: 'border-crimson-500/30 bg-crimson-500/5', icon: Clock },
  { id: 2, name: 'Events', z: 120, colorClass: 'border-violet-500/30 bg-violet-500/5', icon: Flame },
  { id: 3, name: 'Moments', z: 80, colorClass: 'border-cyan-500/30 bg-cyan-500/5', icon: Zap },
  { id: 4, name: 'Places', z: 40, colorClass: 'border-amber-500/30 bg-amber-500/5', icon: MapPin },
  { id: 5, name: 'People', z: 0, colorClass: 'border-white/10 bg-white/5', icon: Users },
]

const SIGNAL_MODES: readonly SignalMode[] = [
  {
    title: 'Moments',
    image: NIGHT_WALK,
    examples: ['Gym session?', 'Coffee in 20?', 'Night walk?'],
    description: 'Short-lived spontaneous signals that vanish after a few hours.',
    overlayClass: 'bg-amber-500/10',
    accentBarClass: 'bg-amber-500',
    delay: 0,
  },
  {
    title: 'Events',
    image: EVENT_BG,
    examples: ['Open mic night', 'Campus meetup', 'Rooftop music'],
    description: 'Structured gatherings with time, place, capacity, and intent.',
    overlayClass: 'bg-violet-500/10',
    accentBarClass: 'bg-violet-500',
    delay: 0.2,
  },
  {
    title: 'Pulse Map',
    image: PULSE_MAP,
    examples: ['Live heatmap', 'Trending spots', 'Active regions'],
    description: 'A live layered map showing what is happening around you.',
    overlayClass: 'bg-cyan-500/10',
    accentBarClass: 'bg-cyan-500',
    delay: 0.4,
  },
]

const PROCESS_STEPS: readonly ProcessStep[] = [
  { title: 'Drop a Signal', icon: MapPin },
  { title: 'The Radius Opens', icon: Compass },
  { title: 'Nearby People Join', icon: Users },
  { title: 'The Moment Fades', icon: Clock },
]

const PSYCHOLOGY_BLOCKS: readonly PsychologyBlock[] = [
  {
    title: 'Presence',
    description: 'People care about what is happening right now.',
    icon: Eye,
    colorClass: 'bg-cyan-500',
  },
  {
    title: 'Proximity',
    description: 'Nearby things feel more possible to attend.',
    icon: Map,
    colorClass: 'bg-amber-500',
  },
  {
    title: 'Scarcity',
    description: 'Disappearing signals create genuine urgency.',
    icon: Zap,
    colorClass: 'bg-crimson-500',
  },
  {
    title: 'Belonging',
    description: 'Small groups feel more real than massive feeds.',
    icon: Users,
    colorClass: 'bg-violet-500',
  },
]

function Navbar(): ReactElement {
  const [scrolled, setScrolled] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = (): void => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-500 md:px-12',
        scrolled ? 'glass-panel bg-obsidian/80 border-b border-white/5' : 'bg-transparent',
      )}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-crimson-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif font-bold text-xl tracking-wide">Aura</span>
      </div>

      <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-widest uppercase text-white/50">
        <a href="#layers" className="hover:text-white transition-colors text-glow-amber">
          40.7128° N
        </a>
        <a href="#modes" className="hover:text-white transition-colors text-glow-cyan">
          74.0060° W
        </a>
        <a href="#showcase" className="hover:text-white transition-colors">
          Signals
        </a>
      </div>

      <div className="flex items-center space-x-6">
        <Link to="/auth" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
          Sign In
        </Link>
        <Link
          to="/auth"
          className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-full hover:scale-105 transition-transform"
        >
          Enter Aura
        </Link>
      </div>
    </motion.nav>
  )
}

function Hero(): ReactElement {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const opacity = useTransform(scrollY, [0, 600], [1, 0])

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-obsidian">
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0 select-none pointer-events-none">
        <img src={HERO_BG} alt="City night map" className="w-full h-full object-cover opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-noise" />
      </motion.div>

      {FLOATING_CAPSULES.map((capsule) => (
        <motion.div
          key={capsule.text}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
          transition={{
            opacity: { delay: capsule.delay, duration: 1 },
            y: { repeat: Infinity, duration: 4, ease: 'easeInOut', delay: capsule.delay },
          }}
          className="absolute z-10 hidden md:flex items-center space-x-3 glass-panel px-4 py-2 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{ left: capsule.x, top: capsule.y }}
        >
          <div className={cn('w-2.5 h-2.5 rounded-full bg-gradient-to-r', capsule.colorClass)} />
          <span className="text-xs font-medium tracking-wide uppercase text-white/80">{capsule.text}</span>
        </motion.div>
      ))}

      <motion.div style={{ opacity }} className="relative z-20 text-center max-w-5xl px-6 flex flex-col items-center mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <h1 className="font-serif text-6xl md:text-8xl lg:text-[110px] leading-[0.9] tracking-tighter mb-6 text-glow-amber">
            Tonight Is
            <br />
            <span className="italic font-light opacity-90">Already Moving.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl font-light mb-12 leading-relaxed"
        >
          Aura reveals the live moments, hidden gatherings, and nearby signals happening around you — before they
          fade.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link
            to="/auth"
            className="px-8 py-4 bg-white text-black rounded-full font-semibold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Enter Aura
          </Link>
          <Link
            to="/auth"
            className="px-8 py-4 glass-panel text-white rounded-full font-semibold text-sm uppercase tracking-widest hover:bg-white/5 transition-all flex items-center space-x-2"
          >
            <span>Explore Pulse</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

function LayersSection(): ReactElement {
  const containerRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const rotateX = useTransform(scrollYProgress, [0, 1], [50, 65])
  const rotateZ = useTransform(scrollYProgress, [0, 1], [-20, -35])

  return (
    <section
      id="layers"
      ref={containerRef}
      className="relative py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden"
    >
      <div className="grid md:grid-cols-2 gap-20 items-center">
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-none">
              The city has
              <br />
              <span className="italic text-amber-500">layers you can’t see.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 leading-relaxed max-w-md font-light"
          >
            Behind every street, rooftop, café, campus, and late-night corner, something is happening. Aura turns
            those invisible signals into live moments you can actually join.
          </motion.p>
        </div>

        <div className="relative h-[400px] md:h-[600px] [perspective:1000px] flex items-center justify-center">
          <motion.div style={{ rotateX, rotateZ }} className="relative w-full max-w-sm aspect-square [transform-style:preserve-3d]">
            {LAYER_CARDS.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.15 }}
                style={{ transform: `translateZ(${layer.z}px)` }}
                className={cn(
                  'absolute inset-0 rounded-2xl glass-panel border shadow-2xl flex items-center justify-center backdrop-blur-md',
                  layer.colorClass,
                )}
              >
                <div className="flex items-center space-x-2 opacity-50">
                  <layer.icon className="w-5 h-5" />
                  <span className="font-mono text-sm uppercase tracking-widest">{layer.name}</span>
                </div>
              </motion.div>
            ))}

            <div
              className="absolute top-1/2 left-1/2 w-0.5 h-[200px] bg-gradient-to-b from-crimson-500 via-cyan-500 to-white/20 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: 'translateZ(80px) rotateX(90deg)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function SignalsComparison(): ReactElement {
  return (
    <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center mb-24">
        <h2 className="font-serif text-5xl md:text-6xl mb-6">
          Signals, <span className="italic opacity-50">Not Posts.</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          className="relative bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 flex flex-col grayscale opacity-60"
        >
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-zinc-800 px-4 py-1 rounded-full text-xs font-mono tracking-widest">
            OLD SOCIAL FEEDS
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="space-y-2 flex-1">
                    <div className="w-24 h-2 bg-zinc-800 rounded" />
                    <div className="w-16 h-2 bg-zinc-800/50 rounded" />
                  </div>
                </div>
                <div className="w-full h-32 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <span>Endless scrolling</span>
            <span>Algorithm noise</span>
            <span>Passive</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative glass-panel rounded-3xl p-8 flex flex-col"
        >
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-xs font-mono tracking-widest font-bold shadow-[0_0_20px_rgba(255,170,0,0.5)]">
            AURA SIGNALS
          </div>

          <div className="relative h-[480px] w-full rounded-2xl overflow-hidden bg-midnight border border-white/10 p-6 flex flex-col justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50" />

            <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border border-amber-500/50"
              />
              <motion.div
                animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border border-amber-500/30"
              />
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_#ffaa00]" />
            </div>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="relative z-10 glass-panel rounded-xl p-4 border-amber-500/20">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xl font-serif">Late Night Drive</span>
                <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded-sm">22m left</span>
              </div>
              <div className="flex -space-x-2 mb-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="w-6 h-6 rounded-full bg-white/20 border border-black" />
                ))}
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-[8px]">
                  +3
                </div>
              </div>
              <Link
                to="/auth"
                className="block w-full py-2 text-center bg-white text-black text-xs font-bold uppercase tracking-widest rounded-lg"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          <div className="mt-8 flex justify-between font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
            <span>Happening now</span>
            <span>Nearby</span>
            <span>Actionable</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ModesSection(): ReactElement {
  return (
    <section id="modes" className="py-24 md:py-48 px-6 max-w-screen-2xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {SIGNAL_MODES.map((mode) => (
          <motion.div
            key={mode.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: mode.delay }}
            className="group relative h-[600px] md:h-[700px] rounded-[32px] overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
              style={{ backgroundImage: `url(${mode.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
            <div className={cn('absolute inset-0 mix-blend-overlay', mode.overlayClass)} />

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {mode.examples.map((example) => (
                    <span
                      key={example}
                      className="text-xs font-mono px-3 py-1 glass-panel rounded-full uppercase tracking-widest text-white/80"
                    >
                      {example}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-4xl md:text-5xl">{mode.title}</h3>
                <p className="text-white/60 font-light leading-relaxed max-w-sm">{mode.description}</p>
                <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                  <div className={cn('w-12 h-1', mode.accentBarClass)} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function ProcessSection(): ReactElement {
  return (
    <section className="py-32 border-y border-white/5 bg-obsidian relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <h2 className="font-serif text-4xl md:text-5xl">How Aura Moves</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-0">
          {PROCESS_STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-obsidian border-2 border-white/20 flex items-center justify-center mb-6 relative z-10 group hover:border-amber-500 transition-colors duration-500">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <step.icon className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
              </div>

              <div className="text-xs font-mono text-amber-500/50 mb-3 tracking-widest">0{index + 1}</div>
              <h4 className="font-serif text-xl md:text-2xl">{step.title}</h4>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent -translate-y-1/2 origin-left blur-sm opacity-50"
      />
    </section>
  )
}

function PsychologySection(): ReactElement {
  return (
    <section className="py-32 px-6 max-w-5xl mx-auto">
      <div className="mb-20">
        <h2 className="font-serif text-5xl md:text-6xl max-w-2xl">
          Built on
          <br />
          <span className="italic text-white/50">Human Instinct.</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {PSYCHOLOGY_BLOCKS.map((block, index) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="group relative glass-panel p-10 md:p-12 rounded-[32px] overflow-hidden"
          >
            <div
              className={cn(
                'absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-700',
                block.colorClass,
              )}
            />

            <block.icon className="w-8 h-8 opacity-50 mb-8" />
            <h3 className="font-serif text-3xl mb-4">{block.title}</h3>
            <p className="text-white/50 font-light text-lg">{block.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function LiveShowcase(): ReactElement {
  return (
    <section id="showcase" className="py-24 px-6 md:px-12 max-w-[1600px] mx-auto">
      <div className="glass-panel rounded-[40px] p-2 md:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />

        <div className="bg-obsidian w-full rounded-[32px] min-h-[600px] md:min-h-[800px] border border-white/5 relative overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between z-10 glass-panel">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-crimson-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest">Live City Board</span>
            </div>
            <div className="font-mono text-xs text-white/40">NYC · DATASTREAM ACTIVE</div>
          </div>

          <div className="flex-1 relative">
            <img
              src={CITY_BG}
              alt="City map"
              className="absolute inset-0 w-full h-full object-cover opacity-20 sepia-[0.3] hue-rotate-[180deg]"
            />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 glass-panel p-4 rounded-2xl max-w-[240px] border-cyan-500/20"
            >
              <div className="flex items-center space-x-2 text-cyan-400 mb-2">
                <Terminal className="w-3 h-3" />
                <span className="text-[10px] uppercase font-mono tracking-widest">Radius: 2km</span>
              </div>
              <div className="font-serif text-lg mb-1">Popup Art Show</div>
              <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-cyan-400" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1/4 right-1/4 glass-panel p-4 rounded-2xl max-w-[240px] border-amber-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full bg-zinc-700 border border-obsidian" />
                  <div className="w-5 h-5 rounded-full bg-zinc-600 border border-obsidian" />
                  <div className="w-5 h-5 rounded-full bg-zinc-500 border border-obsidian" />
                </div>
                <span className="text-[10px] font-mono text-amber-500">8/12 FULL</span>
              </div>
              <div className="font-serif text-lg">Jazz at the Cellar</div>
              <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">Fading in 14m</div>
            </motion.div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full flex items-center justify-center">
              <div className="w-64 h-64 border border-white/10 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 border border-white/20 rounded-full relative">
                  <div
                    className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"
                    style={{ animationDuration: '3s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTA(): ReactElement {
  return (
    <section className="relative h-screen flex border-t border-white/5 overflow-hidden items-center justify-center bg-obsidian">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full scale-[1.5] md:scale-[2.5] opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full scale-[1.5] md:scale-[2.5]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-obsidian to-obsidian" />

      <div className="relative z-10 text-center max-w-4xl px-6 flex flex-col items-center">
        <h2 className="font-serif text-5xl md:text-8xl leading-none mb-8">
          The feed is dead.
          <br />
          <span className="italic text-white/50">The city is alive.</span>
        </h2>
        <p className="text-lg md:text-xl text-white/40 font-light mb-12 max-w-xl">
          Step into the hidden layer of what’s happening around you.
        </p>
        <Link
          to="/auth"
          className="relative group px-12 py-5 bg-white text-black font-semibold uppercase tracking-widest text-sm rounded-full overflow-hidden transition-transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <span className="relative z-10">Get Started</span>
        </Link>
      </div>
    </section>
  )
}

function Footer(): ReactElement {
  return (
    <footer className="py-12 text-center border-t border-white/5 glass-panel">
      <div className="flex items-center justify-center space-x-2 text-white/30 text-sm font-mono tracking-widest uppercase">
        <Activity className="w-3 h-3" />
        <span>Aura — All signals fade.</span>
      </div>
    </footer>
  )
}

export default function LandingPage(): ReactElement {
  return (
    <div className="bg-obsidian text-white min-h-screen selection:bg-amber-500/30">
      <Navbar />
      <main>
        <Hero />
        <LayersSection />
        <SignalsComparison />
        <ModesSection />
        <ProcessSection />
        <PsychologySection />
        <LiveShowcase />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
