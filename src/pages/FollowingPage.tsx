import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { ArrowLeft, Users, User, ArrowRight, Loader } from 'lucide-react'
import { cn } from '../lib/utils'

interface FollowUser {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

export default function FollowingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  usePageTitle('Connections')

  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    location.state?.tab === 'followers' ? 'followers' : 'following'
  )
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Get IDs of people I follow
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      // Get IDs of people who follow me
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)

      // Fetch profiles for following
      if (followingData && followingData.length > 0) {
        const ids = followingData.map((f: any) => f.following_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', ids)
        setFollowing((profiles ?? []) as FollowUser[])
      } else {
        setFollowing([])
      }

      // Fetch profiles for followers
      if (followersData && followersData.length > 0) {
        const ids = followersData.map((f: any) => f.follower_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', ids)
        setFollowers((profiles ?? []) as FollowUser[])
      } else {
        setFollowers([])
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentList = activeTab === 'following' ? following : followers

  return (
    <div className="flex-1 overflow-y-auto bg-void pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-panel backdrop-blur-xl border-b border-white/5 py-4 px-6
        flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10
            flex items-center justify-center text-marble/60
            hover:text-marble transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-xl text-marble">Connections</h1>
          <p className="micro-caps text-[10px] text-marble/30">Your social frequency</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 glass-panel p-1 rounded-full w-fit mx-auto">
          {[
            { key: 'following', label: 'Following' },
            { key: 'followers', label: 'Followers' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'micro-caps text-xs px-8 py-2.5 rounded-full transition-all duration-300',
                activeTab === tab.key
                  ? 'bg-marble text-void font-bold shadow-lg shadow-white/5'
                  : 'text-marble/40 hover:text-marble/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="w-6 h-6 text-gold animate-spin" />
            <p className="micro-caps text-xs text-marble/30">Synchronizing nexus...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10
              flex items-center justify-center">
              <Users className="w-8 h-8 text-marble/10" />
            </div>
            <div>
              <p className="font-serif text-2xl text-marble/25">
                No {activeTab} yet
              </p>
              <p className="text-sm text-marble/20 max-w-xs mx-auto mt-2">
                Connections amplify your reach. Discover people in the Pulse feed.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentList.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/app/user/${profile.id}`}>
                  <div className="glass-panel hairline-all rounded-2xl p-4
                    flex items-center justify-between hover:border-white/20
                    transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden
                        bg-marble/10 border border-white/10 flex items-center justify-center">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-marble/20" />
                        )}
                      </div>
                      <div>
                        <p className="text-marble font-medium">
                          {profile.full_name || 'Anonymous'}
                        </p>
                        {profile.username && (
                          <p className="micro-caps text-xs text-marble/30">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-marble/20 group-hover:text-marble/50
                      group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
