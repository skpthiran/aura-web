import { useState } from "react";
import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { cn } from "../lib/utils";

const TIMEFRAMES = ["Live Now", "Later Tonight", "This Weekend"];

const MOCK_MOMENTS = [
  { id: 1, num: "01", title: "Rooftop Symphony", type: "Moment", location: "Midtown", capacity: "32/50", image: "https://picsum.photos/seed/mx1/800/1000", span: "md:col-span-2 lg:col-span-2 lg:row-span-2" },
  { id: 2, num: "02", title: "Secret Gallery", type: "Moment", location: "West End", capacity: "12/15", image: "https://picsum.photos/seed/mx2/800/600", span: "md:col-span-1" },
  { id: 3, num: "03", title: "Underground Set", type: "Moment", location: "Warehouse Dist", capacity: "189/250", image: "https://picsum.photos/seed/mx3/800/600", span: "md:col-span-1" },
  { id: 4, num: "04", title: "Neon Nights", type: "Event", location: "Sector 4", capacity: "400/500", image: "https://picsum.photos/seed/mx4/800/600", span: "md:col-span-2 xl:col-span-1" },
];

export default function TodayPage() {
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[0]);

  return (
    <div className="flex-1 w-full max-w-[1600px] xl:max-w-[2000px] mx-auto pt-12 md:pt-16 pb-32 px-6 md:px-16 overflow-x-hidden">
      
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 gap-8 mb-16 relative">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="z-10 w-full md:w-auto">
          <h1 className="font-serif text-5xl md:text-[80px] leading-[0.8] tracking-[-0.02em] text-marble mb-4 uppercase">PULSE</h1>
          <p className="micro-caps text-marble/50 pl-1">LIVE DISCOVERY • SPONTANEOUS ACTIVITY</p>
        </div>
        
        <div className="z-10 flex gap-1 p-1 hairline-all rounded-full bg-void/50 backdrop-blur-md overflow-x-auto w-full md:w-auto snap-x scrollbar-hide">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={cn(
                "relative px-6 py-3 rounded-full micro-caps transition-all duration-500 whitespace-nowrap snap-center shrink-0",
                activeTimeframe === tf ? "text-void" : "text-marble/40 hover:text-marble/80"
              )}
            >
              {activeTimeframe === tf && (
                <motion.div 
                  layoutId="timeframe-pill" 
                  className="absolute inset-0 bg-marble rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10">{tf}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Structured Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[350px] lg:auto-rows-[400px] gap-6 xl:gap-8">
        {MOCK_MOMENTS.map((item, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
            key={item.id} 
            className={cn(
              "group relative rounded-sm border border-white/5 bg-card overflow-hidden hover:border-gold/20 transition-all duration-700 cursor-pointer",
              item.span
            )}
          >
            {/* Massive background number */}
            <div className="absolute -bottom-10 -right-4 font-serif text-[180px] leading-none text-white/[0.02] group-hover:text-gold-pale/[0.05] transition-colors duration-700 pointer-events-none select-none z-0">
              {item.num}
            </div>

            <div className="absolute inset-0 z-10">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-125 opacity-30 group-hover:scale-105 group-hover:opacity-60 group-hover:grayscale-0 transition-all duration-1000 ease-[0.16,1,0.3,1]" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
            </div>

            {/* Content Payload */}
            <div className="relative z-20 h-full p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full hairline-all backdrop-blur-md flex items-center justify-center bg-white/5">
                    <Flame className="w-3.5 h-3.5 text-crimson-bright" />
                  </div>
                  <span className="micro-caps text-marble/60 flex items-center gap-2">
                    {item.type} <span className="w-1 h-1 rounded-full bg-white/20" /> {item.location}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-crimson-bright animate-pulse glow-gold" />
              </div>

              <div>
                <h3 className="font-serif text-3xl md:text-5xl text-marble mb-4 group-hover:text-gold-pale transition-colors duration-500 tracking-[-0.02em]">{item.title}</h3>
                
                <div className="flex flex-wrap items-end justify-between pt-6 mt-auto gap-4 pointer-events-auto relative z-20">
                  {/* Left: Metadata */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 shrink-0">
                      {[1,2,3].map(j => <img key={j} src={`https://picsum.photos/seed/${item.id}${j}/60/60`} className="w-7 h-7 rounded-full hairline-all grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" referrerPolicy="no-referrer" />)}
                    </div>
                    <span className="micro-caps text-marble/50 shrink-0 tracking-[0.1em] text-[9px] uppercase bg-void/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">{item.capacity} Joined</span>
                  </div>
                  
                  {/* Right: Floating Segmented Actions */}
                  <div className="flex items-center bg-void/60 backdrop-blur-2xl border border-white/5 rounded-full p-1 shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] w-full sm:w-auto ml-auto">
                    <button 
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-full hover:bg-crimson/10 text-marble/40 hover:text-crimson-bright transition-all duration-500 flex justify-center items-center group/btn"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <span className="micro-caps tracking-[0.2em] text-[9px] uppercase transition-transform group-active/btn:scale-95">Reject</span>
                    </button>
                    
                    {/* Soft Divider */}
                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-white/10 to-transparent shrink-0 mx-1" />
                    
                    <button 
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-full bg-gradient-to-b from-marble/90 to-marble/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.05)] border border-marble/20 text-void hover:from-gold-pale hover:to-gold-pale/80 hover:border-gold-pale/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.4),inset_0_1px_1px_rgba(255,255,255,1)] transition-all duration-500 flex justify-center items-center group/btn relative overflow-hidden"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-[120%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] opacity-0 group-hover:opacity-100 rounded-full" />
                      <span className="micro-caps tracking-[0.2em] text-[9px] uppercase transition-transform group-active/btn:scale-95 relative z-10 drop-shadow-sm font-bold">Join</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
