import { motion } from "motion/react";
import { UserPlus, Flame, ShieldAlert, ArrowRight, Ticket } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_SIGNALS = [
  { id: 1, type: "join", title: "Access Requested", message: "Elias Vance wishes to join your Moment 'Neon Nights'.", time: "2 min ago", icon: UserPlus, status: "pending" },
  { id: 2, type: "alert", title: "Protocol Update", message: "Your Luminous Tier clearance has been extended.", time: "1 hour ago", icon: ShieldAlert, status: "read" },
  { id: 3, type: "event", title: "Colosseum Drop", message: "A new exclusive gathering 'Midnight Symphony' opened in your sector.", time: "4 hours ago", icon: Ticket, status: "unread" },
  { id: 4, type: "activity", title: "Moment Ignited", message: "A spontaneous high-energy signal was detected 0.2 miles away.", time: "Yesterday", icon: Flame, status: "read" },
];

export default function SignalsPage() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto pt-16 pb-32 px-6 md:px-16 overflow-x-hidden">
      <header className="mb-16 border-b border-white/5 pb-8">
        <h1 className="font-serif text-5xl md:text-7xl text-marble tracking-[-0.04em] leading-none mb-4">SIGNALS</h1>
        <p className="micro-caps text-marble/50">NOTIFICATIONS • ALERTS • UPDATES</p>
      </header>

      <div className="flex flex-col gap-4">
        {MOCK_SIGNALS.map((signal, i) => (
          <motion.div 
            key={signal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "group flex items-center gap-6 p-6 hairline-all bg-card/30 hover:bg-white/5 transition-all w-full text-left relative overflow-hidden",
              signal.status === "unread" || signal.status === "pending" ? "border-gold/30 bg-gold/5" : ""
            )}
          >
            {/* Active Highlight Line */}
            {(signal.status === "unread" || signal.status === "pending") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />
            )}
            
            <div className={cn(
              "w-12 h-12 rounded-sm hairline-all flex items-center justify-center shrink-0 transition-colors",
              signal.status === "unread" || signal.status === "pending" ? "text-gold bg-void border-gold/50" : "text-marble/30 bg-void"
            )}>
              <signal.icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-serif text-xl mb-1 truncate transition-colors",
                signal.status === "unread" || signal.status === "pending" ? "text-gold-pale" : "text-marble group-hover:text-gold-pale"
              )}>
                {signal.title}
              </h3>
              <p className="text-sm text-marble/60 leading-relaxed max-w-2xl">{signal.message}</p>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className="font-mono text-[10px] uppercase text-marble/40">{signal.time}</span>
              
              {signal.status === "pending" && (
                <button className="micro-caps text-void bg-marble hover:bg-gold-pale px-4 py-2 transition-colors">
                  Review
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
