import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Zap, X, Bell, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'

interface Toast {
  id: string
  title: string
  description?: string
  link?: string
  type?: 'signal' | 'info' | 'success'
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 6000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 left-6 right-6 lg:bottom-auto lg:top-8 lg:right-8 lg:left-auto 
        z-[100] flex flex-col gap-3 pointer-events-none max-w-sm ml-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <div className="glass-panel hairline-all rounded-2xl overflow-hidden shadow-2xl relative group">
                {/* Progress bar */}
                <motion.div 
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold/30 origin-left"
                />

                <div className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 border border-gold/20">
                    {toast.type === 'signal' ? <Zap className="w-5 h-5 text-gold" /> : <Bell className="w-5 h-5 text-gold" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="micro-caps text-[10px] text-gold mb-1 tracking-widest">Signal Intercepted</p>
                    <h4 className="font-serif text-sm text-marble truncate mb-1">
                      {toast.title}
                    </h4>
                    {toast.description && (
                      <p className="text-xs text-marble/40 line-clamp-1">{toast.description}</p>
                    )}
                  </div>

                  <button 
                    onClick={() => removeToast(toast.id)}
                    className="p-1 hover:bg-white/5 rounded-lg text-marble/20 hover:text-marble transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {toast.link && (
                  <Link 
                    to={toast.link} 
                    onClick={() => removeToast(toast.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border-t border-white/5 
                      hover:bg-gold/10 transition-colors group/link"
                  >
                    <span className="micro-caps text-[9px] text-marble/40 group-hover/link:text-gold transition-colors">
                      View Dossier
                    </span>
                    <ExternalLink className="w-3 h-3 text-marble/20 group-hover/link:text-gold transition-colors" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
