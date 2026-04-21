import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { getJoinedMoments, getChatMessages, sendMessage } from '../lib/db/chat'
import { ChatMessage } from '../types'
import { MessageSquare, ExternalLink, Send, Calendar, Zap, MessageCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { getSignalImage } from '../lib/signalImage'

export default function ChatPage() {
  usePageTitle('Agora')
  const { user: currentUser, profile } = useAuth()
  const navigate = useNavigate()
  
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MOMENTS' | 'EVENTS'>('ALL')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load joined moments on mount
  useEffect(() => {
    if (!currentUser) return
    getJoinedMoments(currentUser.id)
      .then(data => {
        setChannels(data ?? [])
        if (data && data.length > 0) {
          setSelectedChannelId(data[0].moment_id)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingChannels(false))
  }, [currentUser])

  // Poll for messages
  useEffect(() => {
    if (!selectedChannelId) return
    
    const fetchMessages = async () => {
      try {
        const data = await getChatMessages(selectedChannelId)
        // Map profiles to sender for JSX consistency
        const mapped = data.map((m: any) => ({
          ...m,
          sender: m.profiles
        }))
        setMessages(mapped)
      } catch (err) {
        console.error(err)
      }
    }

    fetchMessages()

    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedChannelId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedChannelId || !currentUser) return
    setSending(true)
    const content = inputValue.trim()
    try {
      await sendMessage(selectedChannelId, currentUser.id, content)
      setInputValue('')
      // Refresh messages after sending
      const data = await getChatMessages(selectedChannelId)
      const mapped = data.map((m: any) => ({
        ...m,
        sender: m.profiles
      }))
      setMessages(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const filteredChannels = useMemo(() => {
    return channels
      .map(item => ({
        ...item.moments,
        id: item.moment_id // normalize ID for JSX
      }))
      .filter(channel => {
        if (!channel) return false
        if (activeFilter === 'MOMENTS') return channel.moment_type === 'moment'
        if (activeFilter === 'EVENTS') return channel.moment_type === 'event'
        return true
      })
  }, [channels, activeFilter])

  const selectedChannel = useMemo(() => {
    const item = channels.find(m => m.moment_id === selectedChannelId)
    if (!item?.moments) return null
    return {
      ...item.moments,
      id: item.moment_id
    }
  }, [channels, selectedChannelId])

  return (
    <div className="flex h-screen bg-[#08080f] overflow-hidden">

      {/* ══════════════════════════════════
          LEFT PANEL — Channel List
      ══════════════════════════════════ */}
      <div className="w-[280px] hidden lg:flex flex-shrink-0 flex-col border-r border-white/[0.04]"
        style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #08080f 100%)' }}>

        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white text-[15px] font-bold tracking-[0.08em] uppercase">Agora</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[#c9a84c]">{channels.length} Live</span>
            </div>
          </div>
          <p className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Signal Channels</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-3 border-b border-white/[0.03]">
          {(['ALL', 'MOMENTS', 'EVENTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className="flex-1 py-1.5 rounded-lg text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-200"
              style={{
                background: activeFilter === tab ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: activeFilter === tab ? '#c9a84c' : 'rgba(255,255,255,0.25)',
                border: activeFilter === tab ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
          {filteredChannels.map((channel) => {
            const isActive = selectedChannelId === channel.id;
            const channelImage = channel.image_url || getSignalImage(channel.id, channel.tags, channel.moment_type);
            return (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 group"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  {/* Channel image avatar */}
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={channelImage}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${channel.id}/80/80`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                    {/* Live dot */}
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-[#c9a84c] border border-[#08080f]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white text-[11px] font-bold tracking-wide truncate"
                        style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                        {channel.title}
                      </p>
                      <span className="text-white/20 text-[8px] ml-2 flex-shrink-0">now</span>
                    </div>
                    <p className="text-white/30 text-[9px] tracking-wide truncate uppercase"
                      style={{ letterSpacing: '0.1em' }}>
                      {channel.moment_type || 'moment'} · {channel.participant_count ?? 0} inside
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredChannels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-white/15" />
              </div>
              <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">No active channels</p>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c]/30 to-[#c9a84c]/5 border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-black text-[#c9a84c] uppercase">
                {profile?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase truncate">{profile?.username || 'You'}</p>
              <p className="text-white/20 text-[8px] tracking-[0.15em]">Online</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400/70 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT PANEL — Chat
      ══════════════════════════════════ */}
      {selectedChannel ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Chat header */}
          <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]"
            style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(20px)' }}>

            {/* Channel image */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/8">
              <img
                src={selectedChannel.image_url || getSignalImage(selectedChannel.id, selectedChannel.tags, selectedChannel.moment_type)}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${selectedChannel.id}/80/80`; }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black uppercase text-[14px] tracking-[0.06em] truncate">{selectedChannel.title}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/30 text-[9px] tracking-[0.18em] uppercase">{selectedChannel.participant_count ?? 0} inside</span>
                </div>
                <span className="text-white/10">·</span>
                <span className="text-white/20 text-[9px] tracking-[0.15em] uppercase">{selectedChannel.moment_type || 'Moment'}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/app/moment/${selectedChannel.id}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/[0.03] hover:border-[#c9a84c]/25 hover:bg-[#c9a84c]/5 transition-all group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c9a84c]/60 transition-colors" />
              <span className="text-white/30 text-[9px] tracking-[0.15em] uppercase group-hover:text-white/50 transition-colors">Details</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar"
            style={{ background: 'linear-gradient(180deg, #09090f 0%, #08080f 100%)' }}>

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full border border-[#c9a84c]/10 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="w-16 h-16 rounded-full bg-white/[0.025] border border-white/6 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[#c9a84c]/30" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-white/50 text-[13px] font-bold tracking-[0.06em] uppercase mb-2">Signal Open</p>
                <p className="text-white/15 text-[11px] leading-relaxed max-w-[220px]">
                  Be the first to transmit. This channel is live.
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isOwn = msg.user_id === currentUser?.id;
              const showAvatar = !isOwn && (i === 0 || messages[i-1]?.user_id !== msg.user_id);
              return (
                <div key={msg.id} className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar — only for others, only on first message in group */}
                  {!isOwn && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-white/8 bg-[#c9a84c]/10 flex items-center justify-center"
                      style={{ opacity: showAvatar ? 1 : 0 }}>
                      {msg.sender?.avatar_url
                        ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                        : <span className="text-[9px] font-black text-[#c9a84c] uppercase">{msg.sender?.username?.[0]}</span>
                      }
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showAvatar && !isOwn && (
                      <span className="text-white/25 text-[8px] tracking-[0.15em] uppercase px-1">{msg.sender?.username}</span>
                    )}
                    <div
                      className="px-4 py-2.5 rounded-2xl text-[13px] leading-[1.5] font-light"
                      style={isOwn ? {
                        background: 'linear-gradient(135deg, #c9a84c 0%, #dfc070 100%)',
                        color: '#08080f',
                        borderRadius: '18px 18px 4px 18px',
                        fontWeight: 500,
                      } : {
                        background: 'rgba(255,255,255,0.055)',
                        color: 'rgba(255,255,255,0.75)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '18px 18px 18px 4px',
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="text-white/15 text-[8px] tracking-wide px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.04]"
            style={{ background: 'rgba(8,8,15,0.98)' }}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03] focus-within:border-[#c9a84c]/25 focus-within:bg-white/[0.05] transition-all duration-300">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Transmit a message..."
                className="flex-1 bg-transparent text-white/70 text-[13px] placeholder:text-white/20 outline-none leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                style={{
                  background: inputValue.trim() ? 'linear-gradient(135deg, #c9a84c, #dfc070)' : 'rgba(255,255,255,0.04)',
                  border: inputValue.trim() ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: inputValue.trim() ? '#08080f' : 'rgba(255,255,255,0.2)' }} />
              </button>
            </div>
            <p className="text-center text-white/10 text-[8px] tracking-[0.2em] uppercase mt-2">
              End-to-end encrypted · Aura Protocol
            </p>
          </div>
        </div>

      ) : (
        /* ── DESKTOP EMPTY STATE ── */
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.04) 0%, transparent 65%)'
          }} />
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
          <div className="relative flex flex-col items-center gap-5 max-w-xs text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#c9a84c]/12 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-3 rounded-full border border-[#c9a84c]/8" />
              <div className="w-16 h-16 rounded-full bg-white/[0.025] border border-white/6 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#c9a84c]/40" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className="text-[8px] tracking-[0.3em] uppercase text-[#c9a84c]/40 mb-2">Agora</p>
              <h2 className="text-white/60 text-[18px] font-black tracking-[0.06em] uppercase mb-3">Pick a Channel</h2>
              <p className="text-white/15 text-[11px] leading-relaxed">Select a signal from the left to enter the conversation</p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a84c]/15" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/25" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a84c]/15" />
            </div>
            <p className="text-white/8 text-[8px] tracking-[0.25em] uppercase">Signal Encrypted</p>
          </div>
        </div>
      )}
    </div>
  );
}
