import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { MapPin, Zap, Users, Calendar, ArrowRight, Play } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Live Signals',
    desc: 'Create spontaneous moments that pulse on the map in real-time. Expiring in hours, not days.',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Discovery',
    desc: "Find what's happening within 5KM of you right now. The city reveals itself.",
  },
  {
    icon: Users,
    title: 'Capacity Control',
    desc: 'Set intimate limits. Waitlists form automatically when demand exceeds capacity.',
  },
  {
    icon: Calendar,
    title: 'Curated Events',
    desc: 'Host structured gatherings with dress codes, age gates, and venue details.',
  },
]

const STATS = [
  { value: 'Real-time', label: 'Signal Updates' },
  { value: 'Hyperlocal', label: 'Discovery Radius' },
  { value: 'Ephemeral', label: 'By Design' },
  { value: 'Intimate', label: 'Capacity Limits' },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -60])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      })
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#C9A84C]/60
            flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.08)' }}>
            <span className="font-serif text-base text-[#C9A84C] leading-none">A</span>
          </div>
          <span className="font-serif text-lg tracking-[0.2em] text-white/90">AURA</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <button className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2">
              Sign In
            </button>
          </Link>
          <Link to="/auth">
            <button className="text-sm px-5 py-2.5 rounded-full font-medium
              transition-all duration-300 whitespace-nowrap"
              style={{ background: 'white', color: 'black' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#C9A84C'
                ;(e.currentTarget as HTMLElement).style.color = '#0a0a0f'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'white'
                ;(e.currentTarget as HTMLElement).style.color = 'black'
              }}>
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center
        justify-center text-center px-6 overflow-hidden">

        {/* Parallax orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full blur-[120px] opacity-20"
            style={{
              width: '600px', height: '600px',
              background: '#C9A84C',
              top: '10%', left: '50%',
              transform: `translate(calc(-50% + ${mousePos.x}px), ${mousePos.y}px)`,
              transition: 'transform 0.8s ease-out',
            }} />
          <div className="absolute rounded-full blur-[100px] opacity-10"
            style={{
              width: '400px', height: '400px',
              background: '#7C3AED',
              bottom: '15%', right: '10%',
              transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px)`,
              transition: 'transform 1s ease-out',
            }} />
          <div className="absolute rounded-full blur-[80px] opacity-8"
            style={{
              width: '300px', height: '300px',
              background: '#C9A84C',
              bottom: '20%', left: '5%',
              transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
              transition: 'transform 1.2s ease-out',
            }} />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center">

          {/* Pre-badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full border"
            style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-[#C9A84C]/80">
              Live in your city
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(3rem, 9vw, 7.5rem)', maxWidth: '900px' }}>
            The City Has
            <br />
            <span style={{ color: '#C9A84C' }}>Hidden Signals.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-white/45 text-lg leading-relaxed mb-10"
            style={{ maxWidth: '520px' }}>
            Aura surfaces ephemeral moments — intimate gatherings, spontaneous
            meetups, curated events — all expiring within hours. Be there or miss it.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/auth">
              <button className="flex items-center gap-2.5 px-8 py-4 rounded-full
                font-medium text-sm transition-all duration-300 group"
                style={{ background: 'white', color: 'black' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#C9A84C'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(201,168,76,0.3)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'white'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}>
                Enter Aura
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/auth">
              <button className="flex items-center gap-2 px-6 py-4 rounded-full
                text-sm text-white/50 hover:text-white transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <Play className="w-3.5 h-3.5" />
                See how it works
              </button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex items-center gap-3 text-sm text-white/25">
            <div className="flex -space-x-2">
              {['A','B','C','D'].map((l, i) => (
                <div key={l} className="w-7 h-7 rounded-full border-2 border-black
                  flex items-center justify-center text-xs font-serif text-white/60"
                  style={{ background: `hsl(${i * 60 + 200}, 30%, 20%)` }}>
                  {l}
                </div>
              ))}
            </div>
            <span>Join the network · Invite only</span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs tracking-[0.2em] uppercase text-white/20">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="font-serif text-3xl md:text-4xl mb-2"
                style={{ color: '#C9A84C' }}>{s.value}</p>
              <p className="text-xs tracking-[0.15em] uppercase text-white/30">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: '#C9A84C' }}>How it works</p>
            <h2 className="font-serif text-4xl md:text-6xl text-white/90">
              Designed for the<br />
              <em>present moment</em>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl border transition-all duration-500 cursor-default"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.25)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <f.icon className="w-5 h-5" style={{ color: '#C9A84C' }} />
                </div>
                <h3 className="font-serif text-xl text-white/90 mb-3">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: '#C9A84C' }}>The flow</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white/90">
              Three steps.<br />One city.
            </h2>
          </motion.div>

          <div className="flex flex-col gap-0">
            {[
              { num: '01', title: 'Drop a Signal', desc: 'Choose a type, set a radius, define capacity. Your signal goes live on the map instantly.' },
              { num: '02', title: 'People Find You', desc: 'Nearby users see your signal in the Pulse feed and on the live map. They join or waitlist.' },
              { num: '03', title: 'It Happens', desc: 'Chat with joined participants. The signal expires automatically — leaving only the memory.' },
            ].map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-8 py-10"
                style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span className="font-serif text-5xl shrink-0 leading-none"
                  style={{ color: 'rgba(201,168,76,0.25)' }}>{step.num}</span>
                <div>
                  <h3 className="font-serif text-xl text-white/90 mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-32 px-8 text-center relative overflow-hidden"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full blur-[150px] opacity-15"
            style={{
              width: '700px', height: '400px',
              background: '#C9A84C',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <p className="text-xs tracking-[0.25em] uppercase mb-6"
              style={{ color: '#C9A84C' }}>Ready?</p>
            <h2 className="font-serif mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05 }}>
              Your city is<br />waiting.
            </h2>
            <p className="text-white/40 text-lg mb-10">
              Signals are live right now. Join before they expire.
            </p>
            <Link to="/auth">
              <button className="px-10 py-5 rounded-full text-base font-medium
                transition-all duration-300"
                style={{ background: '#C9A84C', color: '#0a0a0f' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 30px 80px rgba(201,168,76,0.4)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}>
                Enter Aura →
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-8 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border border-[#C9A84C]/40
            flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.06)' }}>
            <span className="font-serif text-xs text-[#C9A84C]">A</span>
          </div>
          <span className="font-serif text-sm tracking-[0.15em] text-white/40">AURA</span>
        </div>
        <p className="text-xs text-white/20">
          © {new Date().getFullYear()} Aura. All signals expire.
        </p>
      </footer>

    </div>
  )
}
