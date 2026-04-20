import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { usePageTitle } from '../hooks/usePageTitle'
import { useFollow } from '../hooks/useFollow'
import { Camera, Check, X, Loader, LogOut, Settings, Grid, Clock, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import { Moment } from '../types'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Profile')
  const { followersCount, followingCount } = useFollow(user?.id)

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

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setUsername(profile.username ?? '')
      setBio((profile as any).bio ?? '')
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
    setBio((profile as any)?.bio ?? '')
    setAvatarUrl(profile?.avatar_url ?? null)
    setError(null)
    setEditing(false)
  }

  const displayName = fullName || profile?.full_name || 'Anonymous'
  const initials = displayName[0]?.toUpperCase() ?? 'A'

  const activeMoments = myMoments.filter(m => m.moment_type === 'moment' && new Date(m.expires_at) > new Date())
  const activeEvents = myMoments.filter(m => m.moment_type === 'event')
  const pastMoments = myMoments.filter(m => new Date(m.expires_at) < new Date())

  const tabMoments = activeTab === 'moments' ? activeMoments
    : activeTab === 'events' ? activeEvents
    : pastMoments

  return (
    <div className="flex-1 overflow-y-auto bg-void">
      <div className="max-w-lg mx-auto">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 pt-10 pb-6">
          <h1 className="font-serif text-2xl text-marble">
            {profile?.username ? `@${profile.username}` : displayName}
          </h1>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="micro-caps text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleCancel}
                  className="w-9 h-9 rounded-full glass-panel hairline-all
                    flex items-center justify-center text-marble/40
                    hover:text-marble transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="micro-caps text-xs px-4 py-2 rounded-full
                    bg-gold text-void font-medium hover:bg-gold/80
                    transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="w-9 h-9 rounded-full glass-panel hairline-all
                  flex items-center justify-center text-marble/40
                  hover:text-marble transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PROFILE HEADER — Instagram layout */}
        <div className="px-5 pb-6">

          {/* Avatar + Stats row */}
          <div className="flex items-center gap-6 mb-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <button
                onClick={() => editing && fileInputRef.current?.click()}
                className={cn(
                  'w-20 h-20 rounded-full border-2 border-white/15',
                  'bg-marble/10 overflow-hidden flex items-center justify-center',
                  editing ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                {uploadingAvatar ? (
                  <Loader className="w-5 h-5 text-gold animate-spin" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <span className="font-serif text-2xl text-marble/60">{initials}</span>
                )}
              </button>
              {editing && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full
                  bg-gold flex items-center justify-center border-2 border-void">
                  <Camera className="w-3 h-3 text-void" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*"
                className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-4 gap-1">
              {[
                { value: myMoments.length, label: 'Signals' },
                { value: followersCount, label: 'Followers', link: '/app/following' },
                { value: followingCount, label: 'Following', link: '/app/following' },
                { value: activeEvents.length, label: 'Events' },
              ].map(stat => (
                stat.link ? (
                  <Link 
                    key={stat.label} 
                    to={stat.link}
                    state={stat.label === 'Followers' ? { tab: 'followers' } : { tab: 'following' }}
                  >
                    <div className="flex flex-col items-center text-center cursor-pointer
                      hover:opacity-70 transition-opacity">
                      <p className="font-semibold text-marble text-lg leading-none mb-1">
                        {stat.value}
                      </p>
                      <p className="text-marble/40 text-[10px] leading-none">{stat.label}</p>
                    </div>
                  </Link>
                ) : (
                  <div key={stat.label} className="flex flex-col items-center text-center">
                    <p className="font-semibold text-marble text-lg leading-none mb-1">
                      {stat.value}
                    </p>
                    <p className="text-marble/40 text-[10px] leading-none">{stat.label}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Name + bio — editing or display */}
          {editing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              {error && (
                <div className="px-3 py-2 rounded-xl bg-red-900/20
                  border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full name"
                maxLength={60}
                className="w-full bg-white/5 border border-white/12 rounded-xl
                  px-4 py-2.5 text-marble outline-none focus:border-gold/50
                  transition-all placeholder:text-marble/20 text-sm"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-marble/30 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="username"
                  maxLength={30}
                  className="w-full bg-white/5 border border-white/12 rounded-xl
                    pl-8 pr-4 py-2.5 text-marble outline-none focus:border-gold/50
                    transition-all placeholder:text-marble/20 text-sm"
                />
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Bio..."
                maxLength={160}
                rows={2}
                className="w-full bg-white/5 border border-white/12 rounded-xl
                  px-4 py-2.5 text-marble outline-none focus:border-gold/50
                  transition-all placeholder:text-marble/20 text-sm resize-none"
              />
            </motion.div>
          ) : (
            <div>
              <p className="text-marble font-semibold text-sm mb-0.5">{displayName}</p>
              {(profile as any)?.bio && (
                <p className="text-marble/50 text-sm leading-relaxed">
                  {(profile as any).bio}
                </p>
              )}
              <p className="text-marble/25 text-xs mt-1">{user?.email}</p>
            </div>
          )}

          {/* Action buttons row */}
          {!editing && (
            <div className="flex gap-2 mt-4">
              <Link to="/app/following" state={{ tab: 'following' }} className="flex-1">
                <button className="w-full py-2 rounded-xl bg-white/8
                  border border-white/12 micro-caps text-xs text-marble/70
                  hover:bg-white/12 transition-all font-medium">
                  Connections
                </button>
              </Link>
              <Link to="/app/history" className="flex-1">
                <button className="w-full py-2 rounded-xl bg-white/8
                  border border-white/12 micro-caps text-xs text-marble/70
                  hover:bg-white/12 transition-all font-medium">
                  History
                </button>
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-xl bg-white/5
                  border border-white/10 text-marble/30
                  hover:text-red-400 hover:border-red-500/20 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-white/8 mx-0 mb-0" />

        {/* TABS — icon style like Instagram */}
        <div className="flex border-b border-white/8">
          {[
            { key: 'moments', icon: Grid, label: 'Moments', count: activeMoments.length },
            { key: 'events', icon: Calendar, label: 'Events', count: activeEvents.length },
            { key: 'past', icon: Clock, label: 'Past', count: pastMoments.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-all',
                'border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-marble text-marble'
                  : 'border-transparent text-marble/25 hover:text-marble/50'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="micro-caps text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* GRID — 3 column photo grid like Instagram */}
        {loadingMoments ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-5 h-5 text-gold animate-spin" />
          </div>
        ) : tabMoments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <p className="font-serif text-xl text-marble/25">
              No {activeTab} yet
            </p>
            {activeTab !== 'past' && (
              <Link to="/app/create">
                <button className="micro-caps text-xs px-5 py-2.5
                  glass-panel hairline-all rounded-full text-marble/40
                  hover:text-marble transition-all mt-2">
                  Create One
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {tabMoments.map((moment) => {
              const isExpired = new Date(moment.expires_at) < new Date()
              const isEvent = moment.moment_type === 'event'
              return (
                <Link key={moment.id} to={`/app/moment/${moment.id}`}>
                  <div className="relative aspect-square overflow-hidden
                    bg-white/5 group cursor-pointer">
                    <img
                      src={`https://picsum.photos/seed/${moment.id}/400/400`}
                      className="w-full h-full object-cover
                        group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.style.opacity = '0' }}
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                      transition-all duration-300 flex items-center justify-center">
                      <p className="opacity-0 group-hover:opacity-100 transition-opacity
                        font-serif text-white text-sm text-center px-2 leading-tight">
                        {moment.title}
                      </p>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                        isExpired
                          ? 'bg-black/60 text-white/40'
                          : isEvent
                            ? 'bg-gold/80 text-void'
                            : 'bg-red-500/80 text-white'
                      )}>
                        {isEvent ? '◈' : '⚡'}
                      </span>
                    </div>
                    {/* Expired dim */}
                    {isExpired && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}
