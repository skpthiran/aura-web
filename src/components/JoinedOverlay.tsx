import { motion } from 'motion/react'
import { Lock, Check } from 'lucide-react'

interface JoinedOverlayProps {
  title?: string
}

export default function JoinedOverlay({ title }: JoinedOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        borderRadius: 'inherit',
        background: 'linear-gradient(135deg, rgba(8,8,15,0.88) 0%, rgba(201,168,76,0.06) 100%)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(201,168,76,0.12)',
          border: '1.5px solid rgba(201,168,76,0.45)',
          boxShadow: '0 0 24px rgba(201,168,76,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Lock style={{ width: 20, height: 20, color: '#C9A84C' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Check style={{ width: 12, height: 12, color: '#4ade80' }} />
        <span style={{
          fontFamily: 'inherit',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#4ade80',
          fontWeight: 500,
        }}>Joined</span>
      </motion.div>

      {title && (
        <p style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          maxWidth: 120,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: 2,
        }}>{title}</p>
      )}
    </motion.div>
  )
}
