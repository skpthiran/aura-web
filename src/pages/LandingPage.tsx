import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 w-full relative min-h-screen flex text-marble selection:bg-gold/20">
      
      {/* Cinematic Absolute Backgrounds */}
      <div className="absolute inset-0 z-0 bg-void overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, filter: "blur(20px)", opacity: 0 }}
          animate={{ scale: 1, filter: "blur(0px)", opacity: 0.4 }}
          transition={{ duration: 4, ease: "easeOut" }}
          className="w-full h-full"
        >
          <img src="https://picsum.photos/seed/mythiccity/1920/1080" alt="Backdrop" className="w-full h-full object-cover mix-blend-luminosity grayscale contrast-[1.2]" referrerPolicy="no-referrer" />
        </motion.div>
        {/* Extreme vignette masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-void via-transparent to-transparent opacity-80" />
      </div>

      <div className="relative z-10 flex flex-col justify-end w-full px-8 md:px-24 pb-20 md:pb-32 max-w-[1800px] mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-end w-full relative">
          
          <div className="max-w-4xl pt-40">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ duration: 1, delay: 0.5 }}
               className="mb-8 flex items-center gap-4"
            >
               <span className="w-12 h-[1px] bg-gold-pale/50" />
               <span className="micro-caps text-gold-pale">01 — The Collective Pulse</span>
            </motion.div>
            
            {/* Massive Typographic Hero */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[14vw] md:text-[9vw] font-serif leading-[0.8] tracking-[-0.04em] mb-12 uppercase text-shadow-glow"
            >
              City <span className="italic font-light text-white/90">Signals</span><br/>
              Distilled.
            </motion.h1>

             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1.5, delay: 1 }}
               className="flex flex-col md:flex-row items-center gap-12"
             >
               <div className="hidden md:block w-[1px] h-16 bg-white/10" />
               <p className="max-w-md text-marble/60 font-light leading-relaxed text-sm md:text-base tracking-wide">
                 An elite social layer for those who dictate the night. 
                 Discover hidden moments, herald exclusive events, and shape the narrative.
               </p>
             </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-auto mt-16 md:mt-0"
          >
            <Link to="/auth" className="group relative flex items-center justify-between w-full md:w-[320px] hairline-all rounded-full p-2 pr-6 bg-void/30 backdrop-blur-3xl hover:bg-white/5 transition-all duration-700 overflow-hidden">
              <div className="absolute inset-0 w-0 bg-gold-pale group-hover:w-full transition-all duration-700 ease-[0.16,1,0.3,1] z-0" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-marble text-void flex items-center justify-center transition-transform duration-500 group-hover:scale-95 group-hover:bg-void group-hover:text-gold-pale">
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <span className="relative z-10 micro-caps tracking-[0.3em] font-bold text-marble group-hover:text-void transition-colors duration-500 w-full text-right">Enter Ritual</span>
            </Link>
          </motion.div>
        
        </div>
      </div>
    </div>
  );
}
