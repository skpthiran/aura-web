import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from '../lib/db/profiles'
import { Camera, Edit3, Save, X, LogOut, User, 
  MapPin, Calendar, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState(profile?.username ?? '')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await updateProfile(user.id, {
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null
      })
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-2xl mx-auto p-6 py-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="micro-caps text-gold mb-2">Identity</p>
            <h1 className="font-serif text-4xl text-marble">Profile</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 micro-caps text-xs 
              text-marble/40 hover:text-crimson-bright transition-colors 
              glass-panel px-4 py-2 rounded-full hairline-all pointer-events-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sever Connection
          </button>
        </div>

        {/* Avatar + basic info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 hairline-all mb-6"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-marble/10 
                border border-white/10 overflow-hidden flex items-center 
                justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} 
                    className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-marble/30" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 
                rounded-full bg-gold/20 border border-gold/40 
                flex items-center justify-center">
                <Camera className="w-3 h-3 text-gold" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="bg-void/50 border border-white/10 rounded-xl 
                      px-4 py-2 text-marble outline-none focus:border-gold/50 
                      text-lg font-serif"
                  />
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="@username"
                    className="bg-void/50 border border-white/10 rounded-xl 
                      px-4 py-2 text-marble/70 outline-none focus:border-gold/50 
                      text-sm micro-caps"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="font-serif text-2xl text-marble mb-1">
                    {profile?.full_name ?? 'Anonymous'}
                  </h2>
                  <p className="micro-caps text-sm text-marble/40">
                    {profile?.username ? `@${profile.username}` : 
                      user?.email ?? ''}
                  </p>
                </div>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={cn(
                "shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
                "transition-colors hairline-all glass-panel",
                editing 
                  ? "text-gold border-gold/30" 
                  : "text-marble/40 hover:text-marble"
              )}
            >
              {editing 
                ? (saving ? '...' : <Save className="w-4 h-4" />)
                : <Edit3 className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Bio */}
          <div className="mt-6 hairline-t pt-6">
            {editing ? (
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Write your signal signature..."
                rows={3}
                maxLength={200}
                className="w-full bg-void/50 border border-white/10 rounded-xl 
                  px-4 py-3 text-marble/70 outline-none focus:border-gold/50 
                  text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-marble/50 italic">
                {profile?.bio ?? 'No signature set.'}
              </p>
            )}
          </div>

          {/* Cancel button when editing */}
          {editing && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-marble text-void micro-caps text-sm 
                  py-3 rounded-xl hover:bg-gold-pale transition-colors
                  disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setUsername(profile?.username ?? '')
                  setFullName(profile?.full_name ?? '')
                  setBio(profile?.bio ?? '')
                }}
                className="w-12 glass-panel hairline-all rounded-xl 
                  flex items-center justify-center text-marble/40 
                  hover:text-marble transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-crimson-bright">{error}</p>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { icon: Zap, label: 'Moments', value: '—' },
            { icon: MapPin, label: 'Locations', value: '—' },
            { icon: Calendar, label: 'Member Since', 
              value: profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString('en', 
                    { month: 'short', year: 'numeric' })
                : '—' 
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} 
              className="glass-panel hairline-all rounded-2xl p-4 
                text-center">
              <Icon className="w-4 h-4 text-gold mx-auto mb-2" />
              <p className="font-serif text-xl text-marble mb-1">{value}</p>
              <p className="micro-caps text-xs text-marble/30">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel hairline-all rounded-3xl p-6"
        >
          <p className="micro-caps text-xs text-marble/30 mb-4">
            Account
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center hairline-b pb-3">
              <span className="micro-caps text-xs text-marble/40">
                Terminal Address
              </span>
              <span className="text-sm text-marble/60">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="micro-caps text-xs text-marble/40">
                Access Tier
              </span>
              <span className="micro-caps text-xs text-gold">
                Luminous Tier
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
