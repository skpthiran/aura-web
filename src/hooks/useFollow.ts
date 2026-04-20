import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  followUser, 
  unfollowUser, 
  checkIsFollowing, 
  getFollowStats 
} from '../lib/db/follows'

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return
    try {
      const stats = await getFollowStats(targetUserId)
      setFollowersCount(stats.followersCount)
      setFollowingCount(stats.followingCount)
    } catch (err) {
      console.error('Error fetching follow stats:', err)
    }
  }, [targetUserId])

  const checkIfFollowing = useCallback(async () => {
    if (!user || !targetUserId) return
    try {
      const following = await checkIsFollowing(user.id, targetUserId)
      setIsFollowing(following)
    } catch (err) {
      console.error('Error checking follow status:', err)
    }
  }, [user, targetUserId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), checkIfFollowing()])
      setLoading(false)
    }
    init()
  }, [fetchStats, checkIfFollowing])

  const toggleFollow = async () => {
    if (!user || !targetUserId) return
    
    // Optimistic update
    const previousState = isFollowing
    const previousCount = followersCount
    
    setIsFollowing(!previousState)
    setFollowersCount(prev => previousState ? prev - 1 : prev + 1)

    try {
      if (previousState) {
        await unfollowUser(user.id, targetUserId)
      } else {
        await followUser(user.id, targetUserId)
      }
    } catch (err) {
      // Rollback on error
      setIsFollowing(previousState)
      setFollowersCount(previousCount)
      console.error('Error toggling follow:', err)
    }
  }

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    toggleFollow,
    refresh: fetchStats
  }
}
