import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { MapPin, Zap, Calendar, MessageSquare, 
  Users, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">

      {/* ── HERO ── */}
      <div className="relative min-h-screen flex flex-col">
        
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/aura-hero/1920/1080"
            className="w-full h-full object-cover opacity-40"
            alt="Hero Background"
          />
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.95) 100%)'
            }}
          />
        </div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-8 pt-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gold/50
              flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <span className="font-serif text-lg text-gold leading-none">A</span>
            </div>
            <span className="font-serif text-xl text-white tracking-wide">Aura</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <button className="micro-caps text-xs text-white/60
                hover:text-white transition-colors px-2 py-2">
                Sign In
              </button>
            </Link>
            <Link to="/auth">
              <button className="micro-caps text-xs px-5 py-2.5 rounded-full
                bg-white text-black hover:bg-gold/90 hover:text-void
                transition-all duration-300 font-medium whitespace-nowrap">
                Get Started
              </button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-20 flex-1 flex flex-col items-center 
          justify-center text-center px-6 py-20">
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="micro-caps text-gold text-xs tracking-[0.5em] mb-6 font-bold"
          >
            ◈ Real-Time Social Discovery
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.16,1,0.3,1] }}
            className="font-serif text-white leading-[0.95] tracking-tight mb-6"
            style={{ fontSize: 'clamp(56px, 12vw, 160px)' }}
          >
            Find Your<br />Moment
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-light"
          >
            Discover spontaneous gatherings and curated events 
            happening around you — right now.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/auth">
              <button className="micro-caps text-sm px-10 py-4 rounded-full
                bg-white text-black hover:bg-gold-pale 
                hover:shadow-2xl hover:shadow-gold/30
                transition-all duration-300 font-bold flex items-center gap-2">
                Enter Aura
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <p className="micro-caps text-xs text-white/30 font-bold tracking-widest">
              Free · No credit card required
            </p>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="relative z-20 flex justify-center pb-8">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <div className="w-px h-8 bg-white/20" />
            <p className="micro-caps text-[10px] text-white/30 tracking-[0.3em]">Scroll</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="bg-black px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <p className="micro-caps text-gold text-xs tracking-[0.4em] mb-4 font-bold">
              ◈ The Platform
            </p>
            <h2 className="font-serif text-white tracking-tight"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
              Everything happens now
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: 'crimson',
                title: 'Moments',
                desc: 'Spontaneous, ephemeral signals that appear on the live map. Created now, gone in 6 hours.'
              },
              {
                icon: Calendar,
                color: 'gold',
                title: 'Events',
                desc: 'Structured gatherings listed in the Colosseum. Plan ahead, curate your experience.'
              },
              {
                icon: MessageSquare,
                color: 'gold',
                title: 'Signal Chat',
                desc: 'Every moment has a live channel. Connect with people before, during, and after.'
              },
              {
                icon: MapPin,
                color: 'crimson',
                title: 'Live Forum',
                desc: 'A real-time map showing every active signal near you with custom filters and radius control.'
              },
              {
                icon: Users,
                color: 'gold',
                title: 'Discovery',
                desc: 'Find your people through the Pulse feed. Join signals, reject noise, shape your world.'
              },
              {
                icon: Zap,
                color: 'crimson',
                title: 'Ephemeral by Design',
                desc: 'No permanence. No pressure. Moments expire. What matters is what happens now.'
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-8 rounded-3xl border border-white/8
                  bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15
                  transition-all duration-500 group relative overflow-hidden"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center 
                  justify-center mb-6 border transition-all duration-500 group-hover:scale-110
                  ${f.color === 'gold' 
                    ? 'bg-gold/10 border-gold/30 text-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'bg-crimson/10 border-crimson/30 text-crimson-bright shadow-[0_0_15px_rgba(220,38,38,0.1)]'}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl text-white mb-3
                  group-hover:text-gold-pale transition-colors">
                  {f.title}
                </h3>
                <p className="text-white/40 text-[15px] leading-relaxed font-light">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="relative overflow-hidden bg-black px-6 py-24 text-center border-t border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[600px] h-[300px] bg-gold/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="micro-caps text-gold text-xs tracking-[0.4em] mb-4 font-bold">
            ◈ Join The Signal
          </p>
          <h2 className="font-serif text-white mb-8 leading-tight tracking-tight"
            style={{ fontSize: 'clamp(36px, 6vw, 80px)' }}>
            Your moment<br />is happening now
          </h2>
          <p className="text-white/40 mb-12 max-w-md mx-auto text-lg font-light">
            Stop scrolling. Start discovering. 
            The world around you is alive with signals.
          </p>
          <Link to="/auth">
            <button className="micro-caps text-sm px-14 py-5 rounded-full
              bg-white text-black hover:bg-gold-pale
              transition-all duration-500 font-bold text-lg shadow-xl hover:shadow-2xl">
              Enter Aura →
            </button>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t border-white/5 px-8 py-10
        flex flex-col md:flex-row items-center justify-between gap-6 text-marble">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
            <span className="font-serif text-sm text-gold/60">A</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-white/40 text-lg">Aura</span>
            <span className="text-white/10">·</span>
            <span className="micro-caps text-[10px] text-white/20 tracking-[0.3em] font-medium">
              Live Social Discovery
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <p className="micro-caps text-[10px] text-white/20 font-medium tracking-[0.2em]">
            Terms of Ritual
          </p>
          <p className="micro-caps text-[10px] text-white/20 font-medium tracking-[0.2em]">
            Privacy Layer
          </p>
          <p className="micro-caps text-[10px] text-white/20 font-medium tracking-[0.2em]">
            © 2026 Aura
          </p>
        </div>
      </footer>

    </div>
  )
}
