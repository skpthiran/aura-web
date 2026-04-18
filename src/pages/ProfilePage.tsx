import { motion } from "motion/react";
import { Copy, Shield, LogOut, Terminal, MapPin, Eye, Activity } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto pt-16 pb-32 px-6 md:px-16 overflow-x-hidden">
      <header className="mb-16 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
           <span className="micro-caps text-gold-pale mb-4 block">06 — Identity Ledger</span>
           <h1 className="font-serif text-5xl md:text-7xl text-marble tracking-[-0.04em] leading-none">Dossier</h1>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 border border-white/10 hover:border-gold/30 hover:text-gold-pale micro-caps bg-void/50 transition-all">
             Audit Logs
           </button>
           <button className="px-6 py-3 bg-marble text-void micro-caps font-bold hover:bg-gold-pale transition-all">
             Configure
           </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Core Identity */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-1 hairline-all bg-void relative overflow-hidden group"
          >
             {/* Tech/Corner framing */}
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/50" />
             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold/50" />
             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold/50" />
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/50" />

             <div className="bg-card p-8 flex flex-col items-center relative z-10 border border-white/5">
                <div className="relative w-40 h-40 mb-8 mt-4">
                  <div className="absolute inset-0 border border-gold/30 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-2 border border-gold/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="absolute inset-4 rounded-full overflow-hidden bg-void">
                    <img src="https://picsum.photos/seed/dossierprofile/200/200" alt="Avatar" className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <h2 className="font-serif text-3xl text-marble mb-1">Aria Vance</h2>
                <div className="flex items-center gap-2 text-gold-pale mb-8 cursor-pointer group/copy">
                  <span className="font-mono text-xs opacity-70 group-hover/copy:opacity-100 transition-opacity">ID: 8092.XV.11</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                </div>

                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="micro-caps text-marble/30">Clearance</span>
                    <span className="font-mono text-xs text-gold">LUMINOUS TIER</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="micro-caps text-marble/30">Status</span>
                    <span className="font-mono text-xs text-marble flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-crimson-bright animate-pulse" /> NETWORKED
                    </span>
                  </div>
                </div>
             </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-2"
          >
            <div className="hairline-all bg-card/50 p-6 flex flex-col items-center justify-center">
              <span className="font-serif text-4xl text-marble mb-2">42</span>
              <span className="micro-caps text-marble/40">Signals Responded</span>
            </div>
            <div className="hairline-all bg-void border-gold/20 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gold/5 group-hover:bg-gold/10 transition-colors" />
              <span className="font-serif text-4xl text-gold-pale mb-2 z-10 text-shadow-glow">12</span>
              <span className="micro-caps text-gold/60 z-10">Rituals Heralded</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column - System Modules */}
        <div className="flex-1 flex flex-col gap-2">
          {[
            { label: "Identity & Cryptography", icon: Shield, desc: "Manage aliases, secure keys, and public face." },
            { label: "Territorial Permissions", icon: MapPin, desc: "Location broadcast, stealth mode, and radius filters." },
            { label: "Signal Activity", icon: Activity, desc: "Past moments, legacy events, and interaction history." },
            { label: "Visio-Interface", icon: Eye, desc: "Display mechanics, typography clustering, and aesthetic controls." },
            { label: "Developer Terminal", icon: Terminal, desc: "Raw data feeds and experimental parameters.", highlight: true }
          ].map((item, idx) => (
             <motion.button 
               key={idx}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 + (idx * 0.1) }}
               className="group flex items-center gap-6 p-6 hairline-all bg-card/30 hover:bg-white/5 transition-all w-full text-left relative overflow-hidden"
             >
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
               
               <div className="w-12 h-12 rounded-sm border border-white/10 flex items-center justify-center text-marble/30 group-hover:text-gold transition-colors bg-void shrink-0">
                 <item.icon className="w-5 h-5" strokeWidth={1.5} />
               </div>
               
               <div className="flex-1">
                 <h3 className="font-serif text-xl text-marble mb-1 group-hover:text-gold-pale transition-colors">{item.label}</h3>
                 <p className="font-mono text-[10px] uppercase text-marble/40 group-hover:text-marble/60 transition-colors">{item.desc}</p>
               </div>

               <div className="font-mono text-xs text-marble/20 group-hover:text-gold/50 transition-colors hidden sm:block">
                 ACCESS_GRANT
               </div>
             </motion.button>
          ))}

          <motion.button 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.8 }}
             className="mt-8 flex items-center justify-center gap-2 p-6 hairline-all bg-transparent text-crimson hover:bg-crimson/5 hover:border-crimson/30 transition-all text-left group"
          >
             <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             <span className="micro-caps tracking-[0.2em] font-medium">Sever Connection</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
