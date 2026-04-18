import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crosshair, Search, Flame, Target, Users, Settings2, Target as Radar } from "lucide-react";
import { cn } from "../lib/utils";

const PINS = [
  { id: 1, type: "moment", x: "35%", y: "45%", title: "Neon Nights", size: "large", pulse: true },
  { id: 2, type: "moment", x: "65%", y: "25%", title: "Jazz Club", size: "small", pulse: false },
  { id: 3, type: "event", x: "48%", y: "68%", title: "The Onyx Gala", size: "large", pulse: false },
  { id: 4, type: "moment", x: "78%", y: "58%", title: "Secret Ramen", size: "medium", pulse: true },
];

export default function MapPage() {
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  return (
    <div className="flex-1 flex relative w-full h-[100dvh] md:h-auto overflow-hidden bg-void">
      {/* Intense Map Background */}
      <div className="absolute inset-0 z-0 bg-deep overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 grayscale contrast-[1.8] brightness-[0.3]"
          style={{ backgroundImage: "url('https://api.maptiler.com/maps/dataviz-dark/static/auto/1600x1200.png?key=fXoQ1w2e3r4t5y6u7i8o')" }}
        />
        <div className="absolute inset-0 hud-overlay mix-blend-multiply opacity-80" />
        {/* Subtle grid lines for HUD effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
      </div>

      {/* Floating HUD Interface */}
      <div className="absolute top-8 left-8 right-8 z-20 flex justify-between gap-6 pointer-events-none items-start">
        
        <div className="flex flex-col gap-3 pointer-events-auto w-full max-w-lg">
           <div className="flex items-center gap-4 mb-2">
             <h1 className="font-serif text-3xl md:text-4xl text-marble tracking-widest uppercase text-shadow-glow">FORUM</h1>
             <span className="micro-caps text-gold-pale/50 hidden md:block">GEOSPATIAL INTELLIGENCE</span>
           </div>
           
           <div className="glass-panel border-white/10 rounded-sm flex items-center px-6 py-4 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 w-1 bg-gold transition-all duration-300 left-0" />
             <Search className="w-5 h-5 text-gold-pale/50 mr-4 group-hover:text-gold transition-colors" strokeWidth={1.5} />
             <input 
               type="text" 
               placeholder="TARGET COORDINATES / EVENT SEARCH" 
               className="bg-transparent border-none outline-none font-mono text-[11px] text-marble w-full uppercase tracking-widest placeholder:text-marble/30"
             />
           </div>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <button className="w-14 h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group">
            <span className="absolute top-1 right-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Crosshair className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button className="w-14 h-14 rounded-sm glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-marble/60 hover:text-gold-pale relative group">
            <span className="absolute top-1 left-1 w-1 h-1 bg-gold-pale rounded-full opacity-0 group-hover:opacity-100" />
            <Settings2 className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Map Pins overlay */}
      <div className="absolute inset-0 z-10">
        {PINS.map((pin) => (
          <motion.button
            key={pin.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: pin.id * 0.15 }}
            onClick={() => setSelectedPin(pin.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group outline-none"
            style={{ left: pin.x, top: pin.y }}
          >
            <div className="relative flex items-center justify-center">
              {pin.pulse && (
                 <>
                  <div className="absolute w-[150px] h-[150px] border border-crimson/20 rounded-full animate-ping opacity-30 pointer-events-none" />
                  <div className="absolute w-[300px] h-[300px] border border-crimson/10 rounded-full animate-ping opacity-10 pointer-events-none animation-delay-500" />
                 </>
              )}
              
              <div className={cn(
                "relative z-10 flex items-center justify-center backdrop-blur-md transition-all duration-500",
                pin.type === "event" ? "bg-obsidian/80 border border-gold-pale text-gold-pale" : "bg-crimson/80 border border-crimson-bright text-white",
                pin.size === "large" ? "w-16 h-16 rounded-sm" : pin.size === "medium" ? "w-10 h-10 rounded-full" : "w-6 h-6 rounded-full",
                selectedPin === pin.id && "scale-110 glow-gold border-gold bg-void shadow-[0_0_30px_rgba(212,175,55,0.4)] z-50"
              )}>
                {/* Internal reticle design for large pins */}
                {pin.size === "large" && (
                  <>
                    <div className="absolute w-1 h-1 bg-[currentColor] top-1 left-1" />
                    <div className="absolute w-1 h-1 bg-[currentColor] bottom-1 right-1" />
                    {pin.type === "event" ? <Target className="w-6 h-6 outline-none" strokeWidth={1.5} /> : <Flame className="w-6 h-6 outline-none" strokeWidth={1.5} />}
                  </>
                )}
              </div>
            </div>
            
            <div className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-4 px-4 py-2 bg-void/90 hairline-all text-[10px] uppercase font-mono tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-1",
              selectedPin === pin.id && "opacity-100 transform translate-y-2 z-50 text-gold-pale shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            )}>
              <span>{pin.title}</span>
              <span className="text-[8px] text-marble/40">LOC // {pin.x} {pin.y}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Dossier Center Panel */}
      <AnimatePresence>
        {selectedPin && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-6 md:p-12 pointer-events-none">
            <motion.div
              initial={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
              animate={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.4)" }}
              exit={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
              className="absolute inset-0 pointer-events-auto"
              onClick={() => setSelectedPin(null)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-card border border-white/10 pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-sm"
              onClick={e => e.stopPropagation()}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/50" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/50" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/50" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/50" />

              <div className="h-[280px] w-full relative">
                <img src="https://picsum.photos/seed/dossier/1000/600" className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 to-transparent" />
                
                <div className="absolute top-8 left-8">
                  <div className="micro-caps text-gold-pale mb-3 flex items-center gap-2">
                    <Radar className="w-3 h-3" /> Signal Intercepted
                  </div>
                  <h2 className="font-serif text-5xl text-marble tracking-[-0.02em]">Neon Nights</h2>
                </div>
              </div>

              <div className="p-8 pb-10 bg-card border-t border-white/5 relative z-10 flex flex-col gap-8">
                 
                 <div className="grid grid-cols-3 gap-6 border-b border-white/5 pb-8">
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Proximity</p>
                      <p className="font-mono text-sm tracking-wider text-marble">0.4 MILES</p>
                    </div>
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Heat Level</p>
                      <p className="font-mono text-sm tracking-wider text-crimson-bright flex items-center gap-2"><div className="w-1 h-3 bg-crimson-bright" /><div className="w-1 h-3 bg-crimson-bright" /><div className="w-1 h-3 bg-crimson-bright/20" /></p>
                    </div>
                    <div>
                      <p className="micro-caps text-marble/30 mb-2">Entity Count</p>
                      <p className="font-mono text-sm tracking-wider text-marble flex items-center gap-2"><Users className="w-4 h-4" /> 42 DETECTED</p>
                    </div>
                 </div>

                 <p className="text-sm/relaxed text-marble/60 font-light max-w-xl">
                   A spontaneous gathering forming around the neon signs of the warehouse district. 
                   Music detected on local frequencies. The entity density is increasing rapidly. Unscheduled, high variance expected.
                 </p>

                 <div className="pt-4 flex items-center justify-between">
                    <button onClick={() => setSelectedPin(null)} className="micro-caps text-marble/40 hover:text-marble transition-colors uppercase">
                      Close Interface
                    </button>
                    <button className="bg-marble text-void px-8 py-4 micro-caps tracking-[0.3em] font-bold hover:bg-gold-pale hover:shadow-[0_0_20px_rgba(243,229,171,0.3)] transition-all flex items-center gap-3">
                      <Crosshair className="w-4 h-4" /> Engage Signal
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
