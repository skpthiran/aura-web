import { motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'

interface JoinedOverlayProps {
  title?: string
}

export default function JoinedOverlay({ title }: JoinedOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl"
    >
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 15 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/40 
          flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(201,168,76,0.2)]">
          <Lock className="w-8 h-8 text-gold" />
        </div>
        
        <h3 className="font-serif text-2xl text-marble mb-1">Joined</h3>
        <p className="micro-caps text-[10px] text-gold tracking-widest">
          Access Granted · Secured
        </p>
        
        <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full
          bg-gold/10 border border-gold/30">
          <Check className="w-3 h-3 text-gold" />
          <span className="micro-caps text-[9px] text-gold font-bold">Aura Verified</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
