import { Search, Send, MapPin, Activity } from "lucide-react";
import { cn } from "../lib/utils";

const THREADS = [
  { id: 1, title: "Neon Nights Planning", desc: "4 members discussing coordinates", time: "2m ago", active: true },
  { id: 2, title: "The Onyx Gala", desc: "Guestlist confirmation", time: "1h ago", active: false },
  { id: 3, title: "Sector 4 Intel", desc: "General region chat", time: "5h ago", active: false },
];

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-[100dvh] md:h-screen w-full bg-void md:flex-row overflow-hidden">
      
      {/* Left Chat Roster */}
      <div className="w-full md:w-[400px] border-r border-white/5 flex flex-col shrink-0 bg-card/20 z-10">
        <div className="p-8 border-b border-white/5">
          <h1 className="font-serif text-5xl text-marble tracking-[-0.04em] uppercase mb-2">AGORA</h1>
          <p className="micro-caps text-marble/50 mb-8">MESSAGING • COORDINATION</p>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 hairline-all focus-within:border-gold/50 transition-colors">
            <Search className="w-4 h-4 text-marble/30" />
            <input 
              type="text" 
              placeholder="SEARCH FREQUENCIES..." 
              className="bg-transparent border-none outline-none font-mono text-[11px] uppercase tracking-widest w-full text-marble placeholder:text-marble/30"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {THREADS.map((thread) => (
             <div 
               key={thread.id} 
               className={cn(
                 "p-6 hairline-b cursor-pointer transition-colors relative group",
                 thread.active ? "bg-white/5" : "hover:bg-white/5"
               )}
             >
               {thread.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />}
               <div className="flex justify-between items-start mb-2">
                 <h3 className={cn("font-serif text-xl transition-colors", thread.active ? "text-gold-pale" : "text-marble group-hover:text-marble")}>
                   {thread.title}
                 </h3>
                 <span className="font-mono text-[9px] uppercase tracking-widest text-marble/30">{thread.time}</span>
               </div>
               <p className="text-sm text-marble/50 line-clamp-1">{thread.desc}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Right Chat Thread */}
      <div className="hidden md:flex flex-1 flex-col relative w-full h-full bg-deep">
         {/* Top Header */}
         <div className="h-24 hairline-b px-8 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-20">
            <div>
              <h2 className="font-serif text-2xl text-marble text-shadow-glow">Neon Nights Planning</h2>
              <div className="flex items-center gap-4 mt-2">
                 <span className="micro-caps text-gold flex items-center gap-2"><MapPin className="w-3 h-3" /> MIDTOWN</span>
                 <span className="micro-caps text-crimson-bright flex items-center gap-2"><Activity className="w-3 h-3" /> ENCRYPTED</span>
              </div>
            </div>
            
            <div className="flex -space-x-3">
              {[1,2,3,4].map(j => <img key={j} src={`https://picsum.photos/seed/a${j}/60/60`} className="w-10 h-10 rounded-full hairline-all grayscale hover:grayscale-0 transition-all hover:z-10" referrerPolicy="no-referrer" />)}
            </div>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 flex flex-col justify-end">
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto align-bottom">
              <div className="flex gap-4">
                 <img src="https://picsum.photos/seed/a1/60/60" className="w-8 h-8 rounded-full hairline-all grayscale shrink-0" referrerPolicy="no-referrer" />
                 <div>
                   <p className="micro-caps text-marble/30 mb-2">Elias // 21:04</p>
                   <div className="bg-white/5 hairline-all p-4 rounded-sm rounded-tl-none">
                     <p className="text-marble/80">Has the perimeter been secured? We are inbound.</p>
                   </div>
                 </div>
              </div>
              <div className="flex gap-4 flex-row-reverse">
                 <img src="https://picsum.photos/seed/user1/60/60" className="w-8 h-8 rounded-full hairline-all shrink-0" referrerPolicy="no-referrer" />
                 <div className="flex flex-col items-end">
                   <p className="micro-caps text-gold/50 mb-2">You // 21:06</p>
                   <div className="bg-gold/10 border border-gold/20 p-4 rounded-sm rounded-tr-none">
                     <p className="text-marble">Visual confirmed. Proceed to alternate entrance.</p>
                   </div>
                 </div>
              </div>
            </div>
         </div>

         {/* Composer */}
         <div className="p-6 bg-card/80 backdrop-blur-3xl hairline-t z-20">
            <div className="max-w-4xl mx-auto relative flex items-center">
              <input 
                type="text"
                placeholder="TRANSMIT SECURE MESSAGE..."
                className="w-full bg-void hairline-all px-6 py-5 pr-16 font-mono text-[11px] uppercase tracking-widest text-marble placeholder:text-marble/30 outline-none focus:border-gold/50 transition-colors"
                autoFocus
              />
              <button className="absolute right-4 w-10 h-10 flex items-center justify-center text-marble/40 hover:text-gold-pale transition-colors hover:scale-110 outline-none">
                <Send className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
         </div>
      </div>

    </div>
  );
}
