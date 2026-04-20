import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { X, Flag, Loader, Check } from 'lucide-react'
import { cn } from '../lib/utils'

const REASONS = [
  'Spam or fake',
  'Inappropriate content',
  'Dangerous activity',
  'Misleading information',
  'Harassment or abuse',
  'Other',
]

interface ReportModalProps {
  momentId: string
  momentTitle: string
  onClose: () => void
}

export default function ReportModal({ momentId, momentTitle, onClose }: ReportModalProps) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user || !reason) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          moment_id: momentId,
          reason,
          details: details.trim() || null,
        })
      if (err) {
        if (err.code === '23505') {
          setError('You have already reported this signal.')
        } else {
          throw err
        }
        return
      }
      setSubmitted(true)
    } catch (e) {
      setError('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center 
          justify-center p-4 sm:p-6"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-md rounded-3xl overflow-hidden"
          style={{ background: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10
                border border-red-500/25 flex items-center justify-center">
                <Flag className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-marble text-sm font-medium">Report Signal</p>
                <p className="text-marble/30 text-xs truncate max-w-[200px]">
                  {momentTitle}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center
                text-marble/30 hover:text-marble transition-colors
                hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 gap-4 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-green-500/10
                  border border-green-500/25 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-marble font-medium mb-1">Report submitted</p>
                  <p className="text-marble/40 text-sm">
                    Thank you. Our team will review this signal.
                  </p>
                </div>
                <button onClick={onClose}
                  className="mt-2 micro-caps text-xs px-6 py-2.5 rounded-full
                    bg-white/8 border border-white/12 text-marble/60
                    hover:text-marble transition-all">
                  Close
                </button>
              </motion.div>
            ) : (
              <>
                <p className="micro-caps text-xs text-marble/40 mb-4">
                  Select a reason
                </p>

                {/* Reason pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        'text-xs px-4 py-2 rounded-full transition-all duration-200',
                        reason === r
                          ? 'bg-red-500/15 border border-red-500/40 text-red-400'
                          : 'bg-white/4 border border-white/10 text-marble/50 hover:text-marble hover:border-white/20'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Optional details */}
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Additional details (optional)..."
                  maxLength={300}
                  rows={3}
                  className="w-full text-sm text-marble placeholder:text-marble/20
                    bg-white/4 border border-white/10 rounded-2xl px-4 py-3
                    outline-none focus:border-white/25 transition-all
                    resize-none mb-4"
                />

                {error && (
                  <p className="text-red-400 text-xs mb-4 px-1">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className={cn(
                    'w-full py-3.5 rounded-2xl micro-caps text-sm font-medium',
                    'transition-all duration-300',
                    !reason || submitting
                      ? 'bg-white/5 text-marble/25 cursor-not-allowed border border-white/8'
                      : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : 'Submit Report'}
                </button>

                <p className="text-center text-marble/20 text-xs mt-3">
                  False reports may result in account suspension.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
