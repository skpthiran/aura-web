import { motion } from "motion/react";
import { Search, MapPin, ArrowRight } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="flex-1 w-full max-w-[1800px] mx-auto pt-16 pb-32 px-6 md:px-16 overflow-x-hidden">
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-12 gap-8">
        <div>
          <h1 className="font-serif text-6xl md:text-[90px] leading-[0.8] tracking-[-0.04em] text-marble text-shadow-glow uppercase mb-4">
            COLOSSEUM
          </h1>
          <p className="micro-caps text-marble/50">PREMIUM EVENTS • CURATED GATHERINGS</p>
        </div>
        <div className="flex flex-col gap-6 max-w-md w-full md:items-end text-left md:text-right">
          <p className="text-marble/50 font-light text-sm leading-relaxed border-l md:border-l-0 md:border-r border-gold/30 pl-4 md:pl-0 md:pr-4">
            The curated ledger of architectural social events. 
            Highly programmed, deeply immersive, restricted capacity.
          </p>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-marble/30" />
             <input 
               type="text" 
               placeholder="SEARCH ARCHIVE..." 
               className="w-full bg-transparent border-b border-white/10 py-3 pl-8 text-xs font-mono tracking-widest text-marble placeholder:text-marble/20 outline-none focus:border-gold-pale transition-colors"
             />
          </div>
        </div>
      </header>

      {/* Editorial Poster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
        {[
          { id: 1, title: "Midnight Symphony", date: "NOV 11", cat: "Sound", img: "https://picsum.photos/seed/ep1/600/900" },
          { id: 2, title: "Gallery Subrosa", date: "NOV 12", cat: "Art", img: "https://picsum.photos/seed/ep2/600/900" },
          { id: 3, title: "The Onyx Gala", date: "NOV 14", cat: "Society", img: "https://picsum.photos/seed/ep3/600/900" },
          { id: 4, title: "Industrial Rhythm", date: "NOV 18", cat: "Energy", img: "https://picsum.photos/seed/ep4/600/900" },
        ].map((event, i) => (
           <motion.div 
             key={event.id}
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
             className="group relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[9/16] bg-void border border-white/5 overflow-hidden cursor-pointer"
           >
              {/* Poster Image */}
              <div className="absolute inset-0">
                <img src={event.img} className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125 opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-1000 ease-[0.16,1,0.3,1]" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
                <div className="absolute inset-0 bg-void/20 group-hover:bg-transparent transition-colors duration-700" />
              </div>

              {/* Top Meta */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10">
                <span className="micro-caps px-3 py-1 hairline-all bg-void/50 backdrop-blur-md rounded-sm text-gold-pale">
                  {event.cat}
                </span>
                <span className="font-mono text-sm tracking-widest text-marble vertical-text opacity-50 block rotate-90 origin-right translate-y-8">
                  {event.date}
                </span>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col z-10 bg-gradient-to-t from-void via-void/80 to-transparent pointer-events-none">
                <h3 className="font-serif text-3xl md:text-4xl text-marble mb-6 leading-[0.9] group-hover:text-white transition-colors duration-500">
                  {event.title.split(' ').map((w, idx) => <span key={idx} className="block">{w}</span>)}
                </h3>
                
                <div className="flex flex-col xl:flex-row xl:items-end justify-between border-t border-white/10 pt-4 opacity-90 group-hover:opacity-100 transition-opacity duration-500 gap-6 pointer-events-auto">
                  <div className="flex flex-col gap-1 w-full xl:w-auto">
                    <span className="micro-caps text-marble/50">Location</span>
                    <span className="font-mono text-[10px] text-marble flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> SECTOR 4</span>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full xl:w-auto">
                     <button 
                       className="flex-1 xl:flex-none px-4 py-2.5 border border-white/10 hover:border-crimson/30 bg-void/50 backdrop-blur-md text-marble/60 hover:text-crimson-bright hover:bg-crimson/5 transition-all micro-caps rounded-sm flex justify-center items-center group/btn shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                       onClick={(e) => { e.stopPropagation(); }}
                     >
                       <span className="transition-transform group-active/btn:scale-95">Reject</span>
                     </button>
                     <button 
                       className="flex-1 xl:flex-none px-4 py-2.5 bg-marble text-void font-bold hover:bg-gold-pale hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all micro-caps rounded-sm flex justify-center items-center group/btn shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                       onClick={(e) => { e.stopPropagation(); }}
                     >
                       <span className="transition-transform group-active/btn:scale-95">Join</span>
                     </button>
                  </div>
                </div>
              </div>
           </motion.div>
        ))}
      </div>
    </div>
  );
}
