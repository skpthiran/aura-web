import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { Search, User, Zap, X, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

interface SearchUser {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
}

interface SearchMoment {
  id: string
  title: string
  moment_type: 'moment' | 'event'
  tags: string[]
  capacity_limit: number
  expires_at: string
}

export default function SearchPage() {
  const { user } = useAuth()
  usePageTitle('Search')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'people' | 'signals'>('people')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [moments, setMoments] = useState<SearchMoment[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([])
      setMoments([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const term = q.trim().toLowerCase()

      // Search users
      const { data: userResults } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
        .neq('id', user?.id ?? '')
        .limit(20)
      setUsers((userResults ?? []) as SearchUser[])

      // Search moments by title or tags
      const { data: momentResults } = await supabase
        .from('moments')
        .select('id, title, moment_type, tags, capacity_limit, expires_at')
        .ilike('title', `%${term}%`)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)
      setMoments((momentResults ?? []) as SearchMoment[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Debounce input
  const handleInput = (val: string) => {
    setQuery(val)
    clearTimeout((window as any).__searchTimer)
    ;(window as any).__searchTimer = setTimeout(() => runSearch(val), 350)
  }

  const clearSearch = () => {
    setQuery('')
    setUsers([])
    setMoments([])
    setSearched(false)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="micro-caps text-gold mb-2">Discover</p>
          <h1 className="font-serif text-4xl text-marble">Search</h1>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2
            w-4 h-4 text-marble/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search people or signals..."
            autoFocus
            className="w-full bg-void/60 border border-white/12 rounded-2xl
              pl-11 pr-11 py-4 text-marble outline-none
              focus:border-gold/40 transition-all
              placeholder:text-marble/25 text-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2
                text-marble/30 hover:text-marble/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'people', label: 'People' },
            { key: 'signals', label: 'Signals' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'people' | 'signals')}
              className={cn(
                'micro-caps text-xs px-5 py-2 rounded-full transition-all',
                tab === t.key
                  ? 'bg-marble text-void font-medium'
                  : 'glass-panel hairline-all text-marble/40 hover:text-marble/70'
              )}
            >
              {t.label}
              {t.key === 'people' && searched && (
                <span className="ml-2 text-marble/30">({users.length})</span>
              )}
              {t.key === 'signals' && searched && (
                <span className="ml-2 text-marble/30">({moments.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-5 h-5 text-gold animate-spin" />
          </div>
        )}

        {/* Empty / placeholder */}
        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full glass-panel hairline-all
              flex items-center justify-center">
              <Search className="w-6 h-6 text-marble/20" />
            </div>
            <p className="font-serif text-2xl text-marble/30">
              Find people & signals
            </p>
            <p className="text-sm text-marble/20 max-w-xs">
              Search by name, username, or signal title.
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && searched && tab === 'people' && users.length === 0 && (
          <p className="text-center text-marble/30 py-12 font-serif text-xl">
            No people found
          </p>
        )}
        {!loading && searched && tab === 'signals' && moments.length === 0 && (
          <p className="text-center text-marble/30 py-12 font-serif text-xl">
            No signals found
          </p>
        )}

        {/* People results */}
        {!loading && tab === 'people' && (
          <AnimatePresence>
            <div className="flex flex-col gap-3">
              {users.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/app/user/${u.id}`}>
                    <div className="flex items-center gap-4
                      glass-panel hairline-all rounded-2xl px-4 py-3.5
                      hover:border-white/20 transition-all group cursor-pointer">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full
                        bg-marble/10 border border-white/10
                        overflow-hidden flex items-center justify-center shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display='none' }}
                          />
                        ) : (
                          <span className="font-serif text-lg text-marble/50">
                            {(u.full_name ?? u.username ?? 'A')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-marble font-medium text-sm
                          group-hover:text-gold-pale transition-colors truncate">
                          {u.full_name ?? 'Anonymous'}
                        </p>
                        {u.username && (
                          <p className="micro-caps text-xs text-marble/40 truncate">
                            @{u.username}
                          </p>
                        )}
                        {u.bio && (
                          <p className="text-xs text-marble/30 truncate mt-0.5">
                            {u.bio}
                          </p>
                        )}
                      </div>
                      <span className="text-marble/20
                        group-hover:text-marble/50 transition-colors">→</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Signal results */}
        {!loading && tab === 'signals' && (
          <AnimatePresence>
            <div className="flex flex-col gap-3">
              {moments.map((m, i) => {
                const isEvent = m.moment_type === 'event'
                const hoursLeft = Math.max(0, Math.round(
                  (new Date(m.expires_at).getTime() - Date.now()) / 3600000
                ))
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link to={`/app/moment/${m.id}`}>
                      <div className={cn(
                        'glass-panel hairline-all rounded-2xl px-4 py-4',
                        'hover:border-white/20 transition-all group cursor-pointer'
                      )}>
                        <div className="flex items-start justify-between mb-2">
                          <span className={cn(
                            'micro-caps text-xs px-3 py-1 rounded-full border',
                            isEvent
                              ? 'bg-gold/10 border-gold/30 text-gold'
                              : 'bg-red-900/20 border-red-500/30 text-red-400'
                          )}>
                            {isEvent ? '◈ Event' : '⚡ Moment'}
                          </span>
                          <span className="micro-caps text-xs text-marble/30">
                            {hoursLeft}h left
                          </span>
                        </div>
                        <p className="text-marble font-medium text-sm mb-1
                          group-hover:text-gold-pale transition-colors">
                          {m.title}
                        </p>
                        {m.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.tags.slice(0, 4).map(tag => (
                              <span key={tag}
                                className="micro-caps text-xs px-2.5 py-1
                                  rounded-full bg-white/5 text-marble/40
                                  border border-white/8">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}

      </div>
    </div>
  )
}
