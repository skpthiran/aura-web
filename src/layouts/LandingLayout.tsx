import { Outlet, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-void text-marble selection:bg-gold/20 flex flex-col relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-start overflow-hidden">
        <div className="w-[800px] h-[600px] bg-gold/5 blur-[120px] rounded-full -top-[300px] absolute mix-blend-screen" />
        <div className="w-[600px] h-[600px] bg-crimson/5 blur-[120px] rounded-full -top-[200px] -right-[200px] absolute mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full z-50 px-6 py-6 lg:px-12 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-colors">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <span className="font-serif text-xl tracking-widest text-marble group-hover:text-gold-pale transition-colors">AURA</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/auth" className="text-sm font-medium tracking-wide hover:text-gold transition-colors">Sign In</Link>
          <Link to="/auth" className="text-sm font-medium tracking-wide bg-marble text-obsidian px-6 py-2.5 rounded-full hover:bg-gold-pale transition-transform hover:scale-105">
            Enter Aura
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <motion.main 
        className="flex-1 flex flex-col z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
