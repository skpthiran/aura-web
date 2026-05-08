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
  description: string
  image: string
  chips: readonly string[]
}

type FeatureCard = {
  icon: LucideIcon
  title: string
  description: string
}

type FlowStep = {
  id: string
  title: string
  description: string
}

type Pillar = {
  title: string
  description: string
}

const PRODUCT_CARDS: readonly ProductCard[] = [
  {
    title: 'Moments',
    description: 'Short-lived signals for spontaneous plans.',
    image: momentBg,
    chips: ['Live Radius', 'Fast Join', 'Expires Soon'],
  },
  {
    title: 'Events',
    description: 'Structured gatherings with time, place, capacity, and intent.',
    image: eventBg,
    chips: ['Scheduled', 'Capacity', 'Intent-Led'],
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
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Discovery',
    description: 'Aura filters by proximity so your map reveals social gravity near you, not everywhere.',
  },
  {
    icon: Users,
    title: 'Capacity Control',
    description: 'Define intimate limits, build right-sized groups, and keep gatherings intentional.',
  },
  {
    icon: Timer,
    title: 'Expiring by Design',
    description: 'Moments naturally disappear to reward timing and protect momentum.',
  },
  {
    icon: Sparkles,
    title: 'Social Proof / Participants',
    description: 'See live join energy so you know a signal is real before you move.',
  },
  {
    icon: Radar,
    title: 'Real-time Map Layer',
    description: 'A city-scale pulse board that translates hidden activity into visible opportunities.',
  },
]

const PILLARS: readonly Pillar[] = [
  {
    title: 'Presence',
    description: 'What matters is what is alive right now.',
  },
  {
    title: 'Proximity',
    description: 'Real people near you, not infinite distance scrolling.',
  },
  {
    title: 'Scarcity',
    description: 'Signals disappear, so moments feel urgent and real.',
  },
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

  const smoothX = useSpring(mouse.x, { stiffness: 120, damping: 20, mass: 0.8 })
  const smoothY = useSpring(mouse.y, { stiffness: 120, damping: 20, mass: 0.8 })
  const orbTransform = useMotionTemplate`translate3d(${smoothX}px, ${smoothY}px, 0)`

  const timelineRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start end', 'end start'] })
  const timelineGlow = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const x = ((index * 17) % 100) + 1
        const y = ((index * 29) % 100) + 1
        const delay = (index % 6) * 0.5
        const duration = 5 + (index % 5)
        return { x, y, delay, duration }
      }),
    [],
  )

  return (
    <div className="relative min-h-screen overflow-x-clip bg-void text-marble">
      <div className="pointer-events-none absolute inset-0 cinematic-map opacity-95" />
      <div className="pointer-events-none absolute inset-0 city-grid-bg opacity-35" />
      <div className="pointer-events-none absolute inset-0 noise-texture opacity-45" />

      <nav className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl md:px-6">
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
        <section className="relative isolate flex min-h-screen items-center overflow-hidden px-5 pb-16 pt-32 md:px-10">
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="city-orb absolute -left-24 top-20 h-80 w-80 rounded-full bg-gold/20 blur-[90px]"
              style={{ transform: orbTransform }}
            />
            <motion.div
              className="city-orb absolute bottom-10 right-0 h-72 w-72 rounded-full bg-crimson/20 blur-[110px]"
              style={{ transform: orbTransform }}
            />
            <div className="signal-ring absolute left-[10%] top-[22%] h-32 w-32 rounded-full border border-gold/40" />
            <div className="signal-ring absolute right-[14%] top-[20%] h-40 w-40 rounded-full border border-gold/30 [animation-delay:1.1s]" />
            <div className="signal-ring absolute bottom-[16%] left-[22%] h-28 w-28 rounded-full border border-gold/35 [animation-delay:1.7s]" />
            {particles.map((particle) => (
              <motion.span
                key={`${particle.x}-${particle.y}`}
                className="absolute h-1 w-1 rounded-full bg-gold/70"
                style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
                animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-gold/85">
                <span className="h-1.5 w-1.5 rounded-full bg-gold pulse-dot" />
                Live city signals
              </div>

              <h1 className="max-w-2xl font-serif text-5xl leading-[0.95] text-white text-shadow-glow sm:text-6xl lg:text-8xl">
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
              transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-md"
            >
              <motion.div
                className="float-drift gradient-border rounded-[2rem] bg-black/45 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                whileHover={{ y: -6 }}
              >
                <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-card/85 p-4">
                  <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/55">
                    <span>Live Signal</span>
                    <span className="rounded-full border border-gold/40 bg-gold/15 px-2 py-1 text-gold">2.1 km</span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-lg text-white">Rooftop Vinyl Drop</p>
                        <p className="text-sm text-white/60">Midnight set near River Loop</p>
                      </div>
                      <div className="rounded-lg bg-gold/15 px-2 py-1 text-xs font-medium text-gold">LIVE</div>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs text-white/65">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <Users className="mx-auto mb-1 h-4 w-4 text-gold" />
                        26 Joined
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <Timer className="mx-auto mb-1 h-4 w-4 text-gold" />
                        48m left
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <CalendarClock className="mx-auto mb-1 h-4 w-4 text-gold" />
                        Radius 3km
                      </div>
                    </div>

                    <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-black/60">
                      <div className="absolute inset-0 city-grid-bg opacity-25" />
                      <motion.div
                        className="signal-ring absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/50"
                        animate={{ scale: [0.9, 1.5], opacity: [0.8, 0] }}
                        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' }}
                      />
                      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_rgba(212,175,55,0.95)]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="glass-panel absolute -left-8 top-12 rounded-2xl border border-gold/20 px-3 py-2 text-xs text-white/70"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gold" />
                  Soho rooftop · 2.1km
                </div>
              </motion.div>

              <motion.div
                className="glass-panel absolute -bottom-6 right-0 rounded-2xl border border-gold/20 px-3 py-2 text-xs text-white/70"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                9 people joined in the last 3 min
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 py-20 md:px-10">
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
                whileHover={{ y: -6 }}
                className="light-sweep group relative overflow-hidden rounded-[2rem] border border-white/15 bg-black/40 p-7"
              >
                <motion.div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: `url(${card.image})` }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/80" />
                <div className="absolute inset-0 rounded-[2rem] ring-1 ring-gold/25" />

                <div className="relative z-10 flex h-full min-h-72 flex-col justify-between">
                  <div>
                    <p className="micro-caps mb-4 text-gold/80">{card.title}</p>
                    <h3 className="mb-3 font-serif text-3xl text-white">{card.description}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {card.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section ref={timelineRef} className="relative mx-auto max-w-5xl px-5 py-20 md:px-10">
          <div className="mb-12 text-center">
            <p className="micro-caps mb-3 text-gold/80">Live Pulse / How It Works</p>
            <h2 className="font-serif text-4xl text-white sm:text-5xl">Signal moves. People move.</h2>
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-5 top-4 h-[calc(100%-2rem)] w-px bg-white/10 md:left-7" />
            <motion.div
              className="absolute left-5 top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-gold via-gold/40 to-transparent md:left-7"
              style={{ clipPath: useMotionTemplate`inset(0 0 ${timelineGlow} 0)` }}
            />

            <div className="space-y-10">
              {FLOW_STEPS.map((step, index) => (
                <motion.article
                  key={step.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.14, duration: 0.6 }}
                  className="relative pl-16 md:pl-20"
                >
                  <div className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-gold/45 bg-black text-sm font-semibold text-gold md:left-2 md:h-11 md:w-11">
                    {step.id}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                    <h3 className="mb-2 font-serif text-2xl text-white">{step.title}</h3>
                    <p className="text-white/70">{step.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 py-20 md:px-10">
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
                whileHover={{ y: -5 }}
                className="feature-card group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.035] p-6 backdrop-blur-xl"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-crimson/10" />
                </div>
                <div className="relative z-10">
                  <div className="mb-4 inline-flex rounded-2xl border border-gold/35 bg-gold/12 p-3 text-gold">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{feature.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 py-20 md:px-10">
          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-8 text-center backdrop-blur-xl md:p-14">
            <p className="micro-caps mb-3 text-gold/80">Why Aura Feels Different</p>
            <h2 className="mx-auto mb-8 max-w-3xl font-serif text-4xl text-white sm:text-5xl">
              Not another feed. A reason to leave the house.
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-white/70">
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
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="micro-caps mb-2 text-gold">{pillar.title}</p>
                  <p className="text-sm text-white/75">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-28 text-center md:px-10">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="signal-ring h-56 w-56 rounded-full border border-gold/30" />
            <div className="signal-ring absolute h-80 w-80 rounded-full border border-gold/20 [animation-delay:0.7s]" />
            <div className="signal-ring absolute h-[28rem] w-[28rem] rounded-full border border-gold/10 [animation-delay:1.3s]" />
          </div>

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
