import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  Radar,
  Sparkles,
  Timer,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'

import eventBg from '../assets/event-bg.png'
import momentBg from '../assets/moment-bg.png'

type ProductCard = {
  title: 'Moments' | 'Events'
  subtitle: string
  description: string
  image: string
  chips: readonly string[]
  stats: readonly string[]
}

type FeatureCard = {
  icon: LucideIcon
  title: string
  description: string
  meta: string
}

type FlowStep = {
  id: string
  title: string
  description: string
}

type Pillar = {
  title: string
  description: string
  motif: string
}

type AmbientChip = {
  label: string
  x: number
  y: number
  delay: number
}

const PRODUCT_CARDS: readonly ProductCard[] = [
  {
    title: 'Moments',
    subtitle: 'Ephemeral social pulse',
    description: 'Signals for spontaneous plans that appear fast, gather nearby people, then disappear.',
    image: momentBg,
    chips: ['Live Radius', 'Fast Join', 'Expires Soon'],
    stats: ['26 joined', '48m left', '2.1 km'],
  },
  {
    title: 'Events',
    subtitle: 'Structured city gravity',
    description: 'Intent-led gatherings with schedule, capacity, and rich context for committed nights.',
    image: eventBg,
    chips: ['Scheduled', 'Capacity', 'Intent-Led'],
    stats: ['72 spots', 'Tonight 11:30', 'Rooftop district'],
  },
]

const FLOW_STEPS: readonly FlowStep[] = [
  {
    id: '01',
    title: 'Drop a Signal',
    description: 'Set radius, tone, and timing. Aura lights up your location instantly.',
  },
  {
    id: '02',
    title: 'People Nearby Discover It',
    description: 'Neighbors catch the pulse in real time and step into the same moment.',
  },
  {
    id: '03',
    title: 'The Moment Happens Before It Expires',
    description: 'Signals fade by design, leaving energy in the city, not noise in a feed.',
  },
]

const FEATURE_CARDS: readonly FeatureCard[] = [
  {
    icon: Zap,
    title: 'Live Signals',
    description: 'Publish now, pulse instantly, and sync attention with what is happening this minute.',
    meta: 'real-time broadcast',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Discovery',
    description: 'Aura filters by proximity so your map reveals social gravity near you, not everywhere.',
    meta: 'distance-aware feed',
  },
  {
    icon: Users,
    title: 'Capacity Control',
    description: 'Define intimate limits, build right-sized groups, and keep gatherings intentional.',
    meta: 'intentional groups',
  },
  {
    icon: Timer,
    title: 'Expiring by Design',
    description: 'Moments naturally disappear to reward timing and protect momentum.',
    meta: 'scarcity engine',
  },
  {
    icon: Sparkles,
    title: 'Live Participant Proof',
    description: 'See join energy in motion before deciding where to move tonight.',
    meta: 'social confidence',
  },
  {
    icon: Radar,
    title: 'City Signal Layer',
    description: 'A cinematic map layer translating hidden activity into visible opportunities.',
    meta: 'urban telemetry',
  },
]

const PILLARS: readonly Pillar[] = [
  {
    title: 'Presence',
    description: 'What matters is what is alive right now.',
    motif: 'P',
  },
  {
    title: 'Proximity',
    description: 'Real people near you, not infinite distance scrolling.',
    motif: 'R',
  },
  {
    title: 'Scarcity',
    description: 'Signals disappear, so moments feel urgent and real.',
    motif: 'S',
  },
]

const PARTICLE_COUNT = 18
const PARTICLE_X_STEP = 19
const PARTICLE_Y_STEP = 31
const PARTICLE_RANGE = 100
const PARTICLE_OFFSET = 1

const AMBIENT_CHIPS: readonly AmbientChip[] = [
  { label: 'live now', x: 12, y: 72, delay: 0.2 },
  { label: '2.1 km', x: 76, y: 22, delay: 0.9 },
  { label: '26 joined', x: 82, y: 61, delay: 1.5 },
  { label: '48m left', x: 18, y: 30, delay: 1.1 },
]

export default function LandingPage(): ReactElement {
  const prefersReducedMotion = useReducedMotion()
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }

    const handleMouseMove = (event: MouseEvent): void => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      setMouse({
        x: ((event.clientX - centerX) / centerX) * 24,
        y: ((event.clientY - centerY) / centerY) * 24,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [prefersReducedMotion])

  const smoothX = useSpring(mouse.x, { stiffness: 110, damping: 22, mass: 0.85 })
  const smoothY = useSpring(mouse.y, { stiffness: 110, damping: 22, mass: 0.85 })

  const farX = useTransform(smoothX, (value) => value * 0.15)
  const farY = useTransform(smoothY, (value) => value * 0.15)
  const midX = useTransform(smoothX, (value) => value * 0.4)
  const midY = useTransform(smoothY, (value) => value * 0.4)
  const frontX = useTransform(smoothX, (value) => value * 0.75)
  const frontY = useTransform(smoothY, (value) => value * 0.75)

  const farTransform = useMotionTemplate`translate3d(${farX}px, ${farY}px, 0)`
  const midTransform = useMotionTemplate`translate3d(${midX}px, ${midY}px, 0)`
  const frontTransform = useMotionTemplate`translate3d(${frontX}px, ${frontY}px, 0)`

  const timelineRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start end', 'end start'] })
  const timelineScaleY = useTransform(scrollYProgress, [0.1, 0.95], [0.06, 1])
  const pulseTravel = useTransform(scrollYProgress, [0.05, 0.95], [0, 100])
  const pulseTravelTop = useMotionTemplate`calc(${pulseTravel}% - 7px)`

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const x = ((index * PARTICLE_X_STEP) % PARTICLE_RANGE) + PARTICLE_OFFSET
        const y = ((index * PARTICLE_Y_STEP) % PARTICLE_RANGE) + PARTICLE_OFFSET
        const delay = (index % 6) * 0.45
        const duration = 5 + (index % 5)
        return { x, y, delay, duration }
      }),
    [],
  )

  return (
    <div className="relative min-h-screen overflow-x-clip bg-void text-marble">
      <div className="pointer-events-none absolute inset-0 cinematic-map opacity-95" />
      <div className="pointer-events-none absolute inset-0 city-grid-bg opacity-28" />
      <div className="pointer-events-none absolute inset-0 noise-texture opacity-40" />
      <div className="pointer-events-none absolute inset-0 city-photo-veil opacity-55" />

      <nav className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/12 bg-black/45 px-4 py-3 backdrop-blur-xl md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-serif text-sm text-gold">
            A
          </span>
          <span className="font-serif text-sm tracking-[0.24em] text-white/90">AURA</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/70 transition hover:text-white"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="rounded-full border border-gold/50 bg-gold/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-gold-pale"
          >
            Enter Aura
          </Link>
        </div>
      </nav>

      <main>
        <section className="section-fade-bottom relative isolate flex min-h-screen items-center overflow-hidden px-5 pb-16 pt-32 md:px-10">
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute inset-[-14%] city-photo-veil opacity-40"
              style={{ transform: farTransform }}
            />
            <motion.div className="absolute inset-0 city-grid-bg opacity-20" style={{ transform: farTransform }} />

            <motion.div
              className="absolute -left-28 top-14 h-96 w-96 rounded-full bg-gold/25 blur-[120px]"
              style={{ transform: midTransform }}
            />
            <motion.div
              className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-crimson/25 blur-[130px]"
              style={{ transform: midTransform }}
            />
            <motion.div
              className="absolute left-[35%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-white/[0.08] blur-[110px]"
              style={{ transform: midTransform }}
            />

            <motion.div className="absolute inset-0" style={{ transform: frontTransform }}>
              <div className="absolute left-[10%] top-[16%] h-44 w-44 rounded-full border border-gold/20 opacity-35" />
              <div className="absolute right-[8%] top-[18%] h-56 w-56 rounded-full border border-gold/15 opacity-35" />
              <div className="absolute bottom-[14%] left-[14%] h-36 w-36 rounded-full border border-gold/20 opacity-35" />
              <div className="absolute left-[8%] top-[64%] h-px w-48 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute right-[10%] top-[58%] h-px w-56 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            </motion.div>

            {!prefersReducedMotion && (
              <>
                <div className="absolute inset-0 signal-trails opacity-45" />
                <div className="absolute inset-0 map-trace-lines opacity-40" />
              </>
            )}

            {particles.map((particle) => (
              <motion.span
                key={`${particle.x}-${particle.y}`}
                className="absolute h-1 w-1 rounded-full bg-gold/70 shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [0.2, 0.9, 0.2], scale: [0.85, 1.25, 0.85], y: [0, -6, 0] }
                }
                transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {AMBIENT_CHIPS.map((chip) => (
              <motion.div
                key={chip.label}
                className="floating-chip absolute hidden rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/75 sm:block"
                style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
                animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 4.5, delay: chip.delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                {chip.label}
              </motion.div>
            ))}
          </div>

          <div className="relative mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-gold/85">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
                Live city signals
              </div>

              <h1 className="max-w-2xl font-serif text-[2.8rem] leading-[1.02] text-white text-shadow-glow md:text-[4rem] lg:text-[6.5rem]">
                The City Has Hidden Signals.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                Aura reveals spontaneous moments, intimate gatherings, and live events happening around
                you — before they disappear.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/auth"
                    className="group inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-gold-pale"
                  >
                    Enter Aura
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/80 transition hover:border-gold/50 hover:text-white"
                  >
                    <Waves className="h-4 w-4 text-gold" />
                    See the Pulse
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.18, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-md"
            >
              <motion.div
                className="float-drift gradient-border spotlight-hover relative rounded-[2rem] bg-black/45 p-3 shadow-[0_20px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                whileHover={{ y: -6 }}
              >
                <div className="absolute -inset-10 bg-gold/15 blur-[85px]" />

                <div className="relative overflow-hidden rounded-[1.6rem] border border-white/12 bg-card/85 p-4">
                  <div className="absolute inset-0 city-grid-bg opacity-[0.16]" />
                  {!prefersReducedMotion && <div className="absolute inset-0 signal-trails opacity-30" />}

                  <div className="relative mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/55">
                    <span>Live Signal</span>
                    <span className="rounded-full border border-gold/40 bg-gold/15 px-2 py-1 text-gold">2.1 km</span>
                  </div>

                  <div className="relative rounded-2xl border border-white/12 bg-black/45 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-lg text-white">Rooftop Vinyl Drop</p>
                        <p className="text-sm text-white/60">Midnight set near River Loop</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gold/15 px-2 py-1 text-xs font-medium text-gold">
                        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
                        LIVE
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs text-white/65">
                      <motion.div className="glass-depth rounded-xl p-2" whileHover={{ y: -2 }}>
                        <Users className="mx-auto mb-1 h-4 w-4 text-gold" />
                        26 Joined
                      </motion.div>
                      <motion.div className="glass-depth rounded-xl p-2" whileHover={{ y: -2 }}>
                        <Timer className="mx-auto mb-1 h-4 w-4 text-gold" />
                        48m left
                      </motion.div>
                      <motion.div className="glass-depth rounded-xl p-2" whileHover={{ y: -2 }}>
                        <CalendarClock className="mx-auto mb-1 h-4 w-4 text-gold" />
                        Radius 3km
                      </motion.div>
                    </div>

                    <div className="relative h-32 overflow-hidden rounded-xl border border-white/12 bg-black/60">
                      <div className="absolute inset-0 city-grid-bg opacity-25" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.28),transparent_52%)]" />
                      {!prefersReducedMotion && <div className="radar-sweep absolute inset-0" />}

                      <motion.div
                        className="signal-ring absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/50"
                        animate={prefersReducedMotion ? undefined : { scale: [0.9, 1.7], opacity: [0.8, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_rgba(212,175,55,0.95)]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="floating-chip glass-panel absolute -left-7 top-10 rounded-2xl border border-gold/20 px-3 py-2 text-xs text-white/75"
                animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gold" />
                  Soho rooftop · 2.1km
                </div>
              </motion.div>

              <motion.div
                className="floating-chip glass-panel absolute -right-3 top-[46%] rounded-2xl border border-gold/20 px-3 py-2 text-xs text-white/75"
                animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                Pulse rising · +9 in 3m
              </motion.div>

              <motion.div
                className="floating-chip glass-panel absolute -bottom-6 right-0 rounded-2xl border border-gold/20 px-3 py-2 text-xs text-white/75"
                animate={prefersReducedMotion ? undefined : { y: [0, 7, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Join window closes soon
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="section-fade-both relative mx-auto max-w-6xl px-5 py-24 md:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(212,175,55,0.13),transparent_42%),radial-gradient(circle_at_86%_65%,rgba(139,0,0,0.15),transparent_44%)]" />

          <div className="mb-12 text-center">
            <p className="micro-caps mb-3 text-gold/80">Product Experience</p>
            <h2 className="font-serif text-4xl text-white sm:text-5xl">Two signal formats. One living city layer.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {PRODUCT_CARDS.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.12, duration: 0.7 }}
                whileHover="hover"
                className="light-sweep group premium-border-card relative overflow-hidden rounded-[2rem] bg-black/45 p-7"
              >
                <motion.div
                  className="absolute inset-0 bg-cover bg-center opacity-75"
                  style={{ backgroundImage: `url(${card.image})` }}
                  variants={{
                    hover: { scale: 1.12, x: index === 0 ? -7 : 7, y: -5 },
                  }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/40 to-black/85" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(212,175,55,0.23),transparent_42%)]" />
                {!prefersReducedMotion && <div className="absolute inset-0 card-noise opacity-30" />}

                <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
                  <span className="floating-chip rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white/80">
                    {card.stats[0]}
                  </span>
                  <span className="floating-chip rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-gold">
                    {card.stats[1]}
                  </span>
                </div>

                <div className="relative z-10 flex h-full min-h-80 flex-col justify-between">
                  <div>
                    <p className="micro-caps mb-3 text-gold/80">{card.title}</p>
                    <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/55">{card.subtitle}</p>
                    <h3 className="mb-3 max-w-md font-serif text-3xl leading-tight text-white">{card.description}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {card.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/75"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold pulse-dot" />
                      {card.stats[2]}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section ref={timelineRef} className="section-fade-both relative mx-auto max-w-5xl px-5 py-24 md:px-10">
          <div className="pointer-events-none absolute inset-0 map-trace-lines opacity-35" />

          <div className="mb-12 text-center">
            <p className="micro-caps mb-3 text-gold/80">Live Pulse / How It Works</p>
            <h2 className="font-serif text-4xl text-white sm:text-5xl">Signal moves. People move.</h2>
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-5 top-4 h-[calc(100%-2rem)] w-px bg-white/10 md:left-7" />
            <motion.div
              className="absolute left-5 top-4 h-[calc(100%-2rem)] w-px origin-top bg-gradient-to-b from-gold via-gold/50 to-transparent shadow-[0_0_22px_rgba(212,175,55,0.35)] md:left-7"
              style={{ scaleY: timelineScaleY }}
            />
            <motion.div
              className="absolute left-5 h-[14px] w-[14px] rounded-full border border-gold/65 bg-gold/45 shadow-[0_0_18px_rgba(212,175,55,0.7)] md:left-7"
              style={{ top: pulseTravelTop, x: '-50%' }}
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.35, 1] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="space-y-10">
              {FLOW_STEPS.map((step, index) => (
                <motion.article
                  key={step.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.14, duration: 0.6 }}
                  whileHover={{ y: -3 }}
                  className="relative pl-16 md:pl-20"
                >
                  <motion.div
                    className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-gold/45 bg-black text-sm font-semibold text-gold md:left-2 md:h-11 md:w-11"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                  >
                    {step.id}
                  </motion.div>
                  <div className="glass-depth spotlight-hover rounded-3xl border border-white/12 bg-white/[0.055] p-6 backdrop-blur-md">
                    <h3 className="mb-2 font-serif text-2xl text-white">{step.title}</h3>
                    <p className="text-white/72">{step.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-fade-both relative mx-auto max-w-6xl px-5 py-24 md:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_32%,rgba(212,175,55,0.12),transparent_40%),radial-gradient(circle_at_78%_62%,rgba(255,255,255,0.05),transparent_42%)]" />

          <div className="mb-12 text-center">
            <p className="micro-caps mb-3 text-gold/80">Features</p>
            <h2 className="font-serif text-4xl text-white sm:text-5xl">Signal intelligence built for nights that matter.</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="feature-card spotlight-hover premium-border-card group relative overflow-hidden rounded-3xl bg-white/[0.04] p-6 backdrop-blur-xl"
              >
                <div className="absolute inset-0 card-noise opacity-25" />
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-crimson/12" />
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                  {feature.meta}
                </div>
                <div className="relative z-10 pt-7">
                  <motion.div
                    className="mb-4 inline-flex rounded-2xl border border-gold/35 bg-gold/12 p-3 text-gold"
                    animate={prefersReducedMotion ? undefined : { y: [0, -2, 0] }}
                    transition={{ duration: 3.4 + (index % 2) * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <feature.icon className="h-5 w-5" />
                  </motion.div>
                  <h3 className="mb-3 font-serif text-2xl text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/72">{feature.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="section-fade-both relative mx-auto max-w-6xl px-5 py-24 md:px-10">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.2),transparent_45%),radial-gradient(circle_at_10%_70%,rgba(139,0,0,0.18),transparent_42%)]" />

          <div className="relative rounded-[2rem] border border-white/12 bg-black/35 p-8 text-center backdrop-blur-xl md:p-14">
            <p className="micro-caps mb-3 text-gold/80">Why Aura Feels Different</p>
            <h2 className="mx-auto mb-8 max-w-3xl font-serif text-4xl text-white sm:text-5xl">
              Not another feed. A reason to leave the house.
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-white/72">
              Aura is built around presence, proximity, scarcity, and real-world social energy.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {PILLARS.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.1, duration: 0.55 }}
                  className="premium-border-card relative overflow-hidden rounded-2xl bg-white/[0.05] p-5 text-left"
                >
                  <div className="absolute -right-3 -top-8 font-serif text-7xl text-white/[0.06]">{pillar.motif}</div>
                  <p className="micro-caps mb-2 text-gold">{pillar.title}</p>
                  <p className="text-sm text-white/75">{pillar.description}</p>
                  <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold/75 to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-fade-top relative overflow-hidden px-5 py-28 text-center md:px-10">
          <div className="pointer-events-none absolute inset-0 city-photo-veil opacity-28" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="signal-ring h-56 w-56 rounded-full border border-gold/30" />
            <div className="signal-ring absolute h-80 w-80 rounded-full border border-gold/20 [animation-delay:0.7s]" />
            <div className="signal-ring absolute h-[28rem] w-[28rem] rounded-full border border-gold/10 [animation-delay:1.3s]" />
            <div className="absolute h-56 w-56 rounded-full bg-gold/10 blur-[70px]" />
          </div>
          {!prefersReducedMotion && <div className="pointer-events-none absolute inset-0 signal-trails opacity-35" />}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 mx-auto max-w-3xl"
          >
            <h2 className="mb-6 font-serif text-5xl leading-tight text-white sm:text-6xl">
              Your city is already moving.
              <br />
              Catch the signal before it fades.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-white/72">
              Enter the hidden live layer and move with people, not algorithms.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-gold/55 bg-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-gold-pale"
            >
              Enter Aura
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="hairline-t px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-white/60 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-serif text-[11px] text-gold">
              A
            </span>
            <span className="font-serif tracking-[0.2em] text-white/80">AURA</span>
          </div>
          <p>All signals expire.</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
