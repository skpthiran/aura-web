import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-gold/30 
            flex items-center justify-center">
            <span className="font-serif text-lg text-gold-pale animate-pulse">
              A
            </span>
          </div>
          <p className="micro-caps text-marble/30">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}
