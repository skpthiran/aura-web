import { motion } from "motion/react";
import { Plus, Flame, Landmark, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function CreatePage() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto pt-16 pb-32 px-6 md:px-16 overflow-x-hidden">
      <header className="mb-16 border-b border-white/5 pb-8 relative">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold/10 blur-[120px] rounded-full pointer-events-none" />
        <h1 className="font-serif text-5xl md:text-[80px] leading-[0.8] tracking-[-0.04em] text-marble text-shadow-glow uppercase mb-4">SUMMON</h1>
        <p className="micro-caps text-marble/50">CREATION RITUALS • SPATIAL DROPS</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto mt-20">
        
        {/* Moment Summon */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="group relative text-left bg-card p-1 hairline-all cursor-pointer overflow-hidden aspect-square flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-crimson/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 p-8 flex justify-between items-start">
             <div className="w-16 h-16 rounded-full hairline-all flex items-center justify-center bg-void group-hover:border-crimson/50 group-hover:shadow-[0_0_30px_rgba(220,20,60,0.3)] transition-all duration-700">
               <Flame className="w-8 h-8 text-marble group-hover:text-crimson transition-colors duration-500" />
             </div>
             <span className="font-mono text-xs text-marble/30 tracking-widest uppercase">Protocol 01</span>
          </div>

          <div className="relative z-10 p-8 border-t border-white/5 bg-void/50 backdrop-blur-md">
            <h2 className="font-serif text-4xl text-marble mb-4 group-hover:text-crimson-bright transition-colors duration-500">Ignite Moment</h2>
            <p className="text-marble/50 text-sm leading-relaxed mb-8">
              A spontaneous, ephemeral gathering. Drops a highly visible signal on the global map. Disappears when the energy fades.
            </p>
            <div className="flex items-center gap-4 text-marble group-hover:text-crimson-bright transition-colors duration-500">
              <span className="micro-caps">Initialize</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          </div>
        </motion.button>

        {/* Event Summon */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="group relative text-left bg-card p-1 hairline-all cursor-pointer overflow-hidden aspect-square flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 p-8 flex justify-between items-start">
             <div className="w-16 h-16 rounded-full hairline-all flex items-center justify-center bg-void group-hover:border-gold/50 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-700">
               <Landmark className="w-8 h-8 text-marble group-hover:text-gold transition-colors duration-500" />
             </div>
             <span className="font-mono text-xs text-marble/30 tracking-widest uppercase">Protocol 02</span>
          </div>

          <div className="relative z-10 p-8 border-t border-white/5 bg-void/50 backdrop-blur-md">
            <h2 className="font-serif text-4xl text-marble mb-4 group-hover:text-gold-pale transition-colors duration-500">Establish Event</h2>
            <p className="text-marble/50 text-sm leading-relaxed mb-8">
              A structured, heavily curated experience. Requires approval. Entered into the Colosseum ledger for future attendance.
            </p>
            <div className="flex items-center gap-4 text-marble group-hover:text-gold-pale transition-colors duration-500">
              <span className="micro-caps">Initialize</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          </div>
        </motion.button>

      </div>
    </div>
  );
}
