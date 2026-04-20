import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { usePageTitle } from '../hooks/usePageTitle'
import { 
  Camera, Check, X, Loader, LogOut, 
  User, AtSign, FileText, Zap, Calendar, Clock
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'
import { Moment } from '../types'
import { useFollow } from '../hooks/useFollow'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  usePageTitle('Profile')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [myMoments, setMyMoments] = useState<Moment[]>([])
  const [loadingMoments, setLoadingMoments] = useState(true)
  const [activeTab, setActiveTab] = useState<'moments' | 'events' | 'past'>('moments')

  const { followersCount, followingCount } = useFollow(user?.id)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setUsername(profile.username ?? '')
      setBio(profile.bio ?? '')
      setAvatarUrl(profile.avatar_url ?? null)
    }
  }, [profile])

  useEffect(() => {
    if (user) fetchMyMoments()
  }, [user])

  const fetchMyMoments = async () => {
    setLoadingMoments(true)
    try {
      const { data } = await supabase
        .from('moments')
        .select('*')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setMyMoments((data ?? []) as Moment[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMoments(false)
    }
  }

  const handleAvatarClick = () => {
    if (editing) fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error(err)
      setError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      // Check username uniqueness if changed
      if (username !== profile?.username && username.trim()) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.trim().toLowerCase())
          .neq('id', user.id)
          .maybeSingle()
        if (existing) {
          setError('Username already taken')
          setSaving(false)
          return
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          username: username.trim().toLowerCase() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(profile?.full_name ?? '')
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
    setAvatarUrl(profile?.avatar_url ?? null)
    setError(null)
    setEditing(false)
  }

  const displayName = fullName || profile?.full_name || 'Anonymous'
  const initials = displayName[0]?.toUpperCase() ?? 'A'
  const filteredMoments = myMoments.filter(m => {
    const isExpired = new Date(m.expires_at) < new Date()
    if (activeTab === 'past') return isExpired
    if (activeTab === 'moments') return m.moment_type === 'moment' && !isExpired
    if (activeTab === 'events') return m.moment_type === 'event'
    return true
  })

  return (
    <div className="flex-1 overflow-y-auto bg-void">

      {/* Banner */}
      <div className="relative overflow-hidden" style={{ height: '240px' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-void via-obsidian to-black" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-gold/6 rounded-full blur-[80px]" />
        </div>

        {/* Top actions */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="micro-caps text-xs text-green-400 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Saved
            </motion.span>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="micro-caps text-xs px-4 py-2 rounded-full
                glass-panel hairline-all text-marble/60
                hover:text-marble transition-all"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full glass-panel hairline-all
                  flex items-center justify-center text-marble/40
                  hover:text-marble transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="micro-caps text-xs px-4 py-2 rounded-full
                  bg-gold text-void font-medium hover:bg-gold/80
                  transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving
                  ? <Loader className="w-3 h-3 animate-spin" />
                  : <Check className="w-3 h-3" />
                }
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6">

        {/* Avatar */}
        <div className="flex items-end justify-between -mt-10 mb-6">
          <div className="relative z-10">
            <button
              onClick={handleAvatarClick}
              className={cn(
                'w-24 h-24 rounded-full border-4 border-void',
                'bg-marble/10 overflow-hidden flex items-center justify-center',
                'shadow-xl transition-all relative z-10',
                editing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
              )}
            >
              {uploadingAvatar ? (
                <Loader className="w-6 h-6 text-gold animate-spin" />
              ) : avatarUrl ? (
                <img src={avatarUrl}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span className="font-serif text-3xl text-marble/60">
                  {initials}
                </span>
              )}
            </button>
            {editing && (
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full
                bg-gold flex items-center justify-center border-2 border-void
                pointer-events-none">
                <Camera className="w-3 h-3 text-void" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="flex items-center gap-2 micro-caps text-xs
              text-marble/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/20
            border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Fields */}
        {editing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mb-8"
          >
            {/* Full name */}
            <div>
              <label className="flex items-center gap-2 micro-caps text-xs
                text-marble/40 mb-2">
                <User className="w-3 h-3" /> Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={60}
                className="w-full bg-void/60 border border-white/12 rounded-xl
                  px-4 py-3 text-marble outline-none focus:border-gold/50
                  transition-all placeholder:text-marble/20 text-sm"
              />
            </div>

            {/* Username */}
            <div>
              <label className="flex items-center gap-2 micro-caps text-xs
                text-marble/40 mb-2">
                <AtSign className="w-3 h-3" /> Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2
                  text-marble/30 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="username"
                  maxLength={30}
                  className="w-full bg-void/60 border border-white/12 rounded-xl
                    pl-8 pr-4 py-3 text-marble outline-none focus:border-gold/50
                    transition-all placeholder:text-marble/20 text-sm"
                />
              </div>
              <p className="micro-caps text-xs text-marble/20 mt-1 ml-1">
                Letters, numbers, underscores only
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 micro-caps text-xs
                text-marble/40 mb-2">
                <FileText className="w-3 h-3" /> Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                maxLength={160}
                rows={3}
                className="w-full bg-void/60 border border-white/12 rounded-xl
                  px-4 py-3 text-marble outline-none focus:border-gold/50
                  transition-all placeholder:text-marble/20 text-sm resize-none"
              />
              <p className="micro-caps text-xs text-marble/20 mt-1 ml-1 text-right">
                {bio.length}/160
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-3xl text-marble mb-1">
              {displayName}
            </h1>
            {(profile?.username || username) && (
              <p className="micro-caps text-sm text-marble/40 mb-3">
                @{profile?.username || username}
              </p>
            )}
            {(profile?.bio || bio) && (
              <p className="text-marble/50 text-sm leading-relaxed mb-4 max-w-md">
                {profile?.bio || bio}
              </p>
            )}
            <p className="micro-caps text-xs text-marble/25">
              {user?.email}
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Followers', value: followersCount },
            { label: 'Following', value: followingCount },
            { label: 'Moments', value: myMoments.filter(m => m.moment_type === 'moment').length },
            { label: 'Events', value: myMoments.filter(m => m.moment_type === 'event').length },
          ].map(stat => (
            <div key={stat.label}
              className="glass-panel hairline-all rounded-2xl p-4 text-center">
              <p className="font-serif text-2xl text-marble mb-1">{stat.value}</p>
              <p className="micro-caps text-xs text-marble/30">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Signal History Link */}
        <div className="flex flex-col gap-3 mb-8">
          <Link to="/app/connections">
            <div className="glass-panel hairline-all rounded-2xl px-5 py-4
              flex items-center justify-between
              hover:border-white/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20
                  flex items-center justify-center">
                  <User className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-marble font-medium">Connections</p>
                  <p className="micro-caps text-xs text-marble/30 mt-0.5">
                    View followers and people you follow
                  </p>
                </div>
              </div>
              <span className="text-marble/20 group-hover:text-marble/50
                transition-colors">→</span>
            </div>
          </Link>

          <Link to="/app/history">
            <div className="glass-panel hairline-all rounded-2xl px-5 py-4
              flex items-center justify-between
              hover:border-white/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10
                  flex items-center justify-center">
                  <Clock className="w-4 h-4 text-marble/40" />
                </div>
                <div>
                  <p className="text-sm text-marble font-medium">Signal History</p>
                  <p className="micro-caps text-xs text-marble/30 mt-0.5">
                    View expired moments you attended
                  </p>
                </div>
              </div>
              <span className="text-marble/20 group-hover:text-marble/50
                transition-colors">→</span>
            </div>
          </Link>
        </div>

        {/* My Signals */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="micro-caps text-xs text-marble/40">My Signals</p>
            <div className="flex gap-2">
              {[
                { key: 'moments', label: '⚡' },
                { key: 'events', label: '◈' },
                { key: 'past', label: '◷' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'moments' | 'events' | 'past')}
                  className={cn(
                    'micro-caps text-xs px-3 py-1.5 rounded-full transition-all',
                    activeTab === tab.key
                      ? 'bg-marble text-void font-medium'
                      : 'glass-panel hairline-all text-marble/40'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingMoments ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-5 h-5 text-gold animate-spin" />
            </div>
          ) : filteredMoments.length === 0 ? (
            <div className="flex flex-col items-center justify-center
              py-12 gap-3 text-center">
              <Zap className="w-6 h-6 text-marble/15" />
              <p className="font-serif text-lg text-marble/25">
                No {activeTab} yet
              </p>
              <Link to="/app/create">
                <button className="micro-caps text-xs px-5 py-2.5
                  glass-panel hairline-all rounded-full text-marble/40
                  hover:text-marble transition-all">
                  Create One
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMoments.map((moment, i) => {
                const isEvent = moment.moment_type === 'event'
                const isExpired = new Date(moment.expires_at) < new Date()
                const hoursLeft = Math.max(0, Math.round(
                  (new Date(moment.expires_at).getTime() - Date.now()) / 3600000
                ))
                return (
                  <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/app/moment/${moment.id}`}>
                      <div className={cn(
                        'glass-panel hairline-all rounded-2xl p-4',
                        'hover:border-white/20 transition-all group cursor-pointer',
                        isExpired && 'opacity-40'
                      )}>
                        <div className="flex items-start justify-between mb-1">
                          <span className={cn(
                            'micro-caps text-xs px-2.5 py-1 rounded-full border',
                            isEvent
                              ? 'bg-gold/10 border-gold/30 text-gold'
                              : 'bg-red-900/20 border-red-500/30 text-red-400'
                          )}>
                            {isEvent ? '◈ Event' : '⚡ Moment'}
                          </span>
                          <span className="micro-caps text-xs text-marble/30">
                            {isExpired ? 'Expired' : `${hoursLeft}h left`}
                          </span>
                        </div>
                        <p className="text-marble text-sm font-medium mt-2
                          group-hover:text-gold-pale transition-colors">
                          {moment.title}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
