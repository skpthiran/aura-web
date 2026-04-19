import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { getJoinedMoments, getChatMessages, sendMessage } from '../lib/db/chat'
import { ChatMessage } from '../types'
import { supabase } from '../lib/supabase'
import { Send, MessageSquare, Zap, Calendar, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'

export default function ChatPage() {
  const { user } = useAuth()
  const [joinedMoments, setJoinedMoments] = useState<any[]>([])
  const [activeMomentId, setActiveMomentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMoments, setLoadingMoments] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load joined moments on mount
  useEffect(() => {
    if (!user) return
    getJoinedMoments(user.id)
      .then(data => {
        console.log('Joined moments data:', data)
        setJoinedMoments(data ?? [])
        if (data && data.length > 0) {
          setActiveMomentId(data[0].moment_id)
        }
      })
      .catch(error => {
        console.log('Joined moments error:', error)
        console.error(error)
      })
      .finally(() => setLoadingMoments(false))
  }, [user])

  useEffect(() => {
    if (!activeMomentId) return
    setLoadingMessages(true)
    
    getChatMessages(activeMomentId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false))

    // Poll every 3 seconds for new messages
    const interval = setInterval(async () => {
      try {
        const data = await getChatMessages(activeMomentId)
        setMessages(data)
      } catch (err) {
        console.error(err)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [activeMomentId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeMomentId || !user) return
    setSending(true)
    try {
      await sendMessage(activeMomentId, user.id, input.trim())
      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full">
      
      {/* Left panel — moment list */}
      <div className="w-72 shrink-0 hairline-r flex flex-col glass-panel bg-void/50">
        <div className="p-5 hairline-b">
          <p className="micro-caps text-gold text-xs mb-1">Channels</p>
          <h2 className="font-serif text-xl text-marble">Signal Chat</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loadingMoments && (
            <p className="micro-caps text-xs text-marble/30 p-3">
              Loading channels...
            </p>
          )}
          
          {!loadingMoments && joinedMoments.length === 0 && (
            <div className="p-4 text-center mt-10">
              <MessageSquare className="w-8 h-8 text-marble/10 mx-auto mb-3" />
              <p className="text-xs text-marble/30 micro-caps mb-3">
                No channels joined
              </p>
              <Link to="/app/today">
                <span className="text-xs text-gold micro-caps 
                  hover:text-gold-pale transition-colors cursor-pointer">
                  Join a Signal →
                </span>
              </Link>
            </div>
          )}
          
          {joinedMoments.map((item) => {
            const moment = item.moments as any
            if (!moment) return null
            const isActive = activeMomentId === item.moment_id
            const isEvent = moment.moment_type === 'event'
            return (
              <button
                key={item.moment_id}
                onClick={() => setActiveMomentId(item.moment_id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all mb-1 cursor-pointer group',
                  isActive 
                    ? 'bg-white/5 hairline-all' 
                    : 'hover:bg-white/3'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                    isEvent ? 'bg-gold/10' : 'bg-crimson/10'
                  )}>
                    {isEvent 
                      ? <Calendar className="w-4 h-4 text-gold" />
                      : <Zap className="w-4 h-4 text-crimson-bright" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-marble truncate font-medium">
                      {moment.title}
                    </p>
                    <p className={cn(
                      "micro-caps text-xs",
                      isEvent ? "text-gold/60" : "text-crimson-bright/60"
                    )}>
                      {isEvent ? 'Event' : 'Moment'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel — messages */}
      <div className="flex-1 flex flex-col overflow-hidden bg-void">
        {!activeMomentId ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-marble/10 mx-auto mb-4" />
              <p className="font-serif text-2xl text-marble/20">
                Select a channel
              </p>
              <p className="micro-caps text-xs text-marble/10 mt-2">
                Secure link active
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header info for mobile/active context */}
            <div className="px-6 py-4 hairline-b bg-void/80 backdrop-blur-md flex items-center justify-between">
               <div>
                  <h3 className="font-serif text-lg text-marble">
                    {joinedMoments.find(m => m.moment_id === activeMomentId)?.moments?.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="micro-caps text-[10px] text-marble/40 tracking-widest">REALTIME_ENCRYPTED</span>
                  </div>
               </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
              {loadingMessages && (
                <div className="flex flex-col items-center gap-2 mt-4">
                   <div className="w-4 h-4 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                   <p className="micro-caps text-[10px] text-marble/30 text-center">
                    Syncing Signal history...
                  </p>
                </div>
              )}
              
              {!loadingMessages && messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center opacity-20">
                  <p className="text-marble/20 font-serif text-xl border-y border-white/5 py-8 px-12 text-center">
                    Frequency silent. <br/>Transmit first thought.
                  </p>
                </div>
              )}
              
              {messages.map((msg, idx) => {
                const isOwn = msg.user_id === user?.id
                const senderName = msg.profiles?.full_name 
                  ?? msg.profiles?.username 
                  ?? 'Anonymous'
                const showSender = idx === 0 || messages[idx-1].user_id !== msg.user_id

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-3 max-w-[85%]',
                      isOwn ? 'ml-auto flex-row-reverse' : ''
                    )}
                  >
                    {/* Avatar */}
                    {showSender ? (
                      <div className="w-8 h-8 rounded-full bg-marble/10 
                        border border-white/10 flex items-center justify-center 
                        shrink-0 mt-1">
                        {msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} 
                            className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-4 h-4 text-marble/30" />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 shrink-0" />
                    )}
                    
                    <div className={cn(
                      'flex flex-col gap-1',
                      isOwn ? 'items-end' : 'items-start'
                    )}>
                      {showSender && (
                        <span className="micro-caps text-[10px] text-marble/30 px-1">
                          {isOwn ? 'Relay — You' : `Identity — ${senderName}`}
                        </span>
                      )}
                      <div className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isOwn 
                          ? 'bg-marble text-void rounded-tr-sm shadow-lg' 
                          : 'glass-panel hairline-all text-marble rounded-tl-sm'
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 bg-void/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto flex gap-3 items-center glass-panel 
                hairline-all bg-void/80 rounded-2xl px-4 py-2 focus-within:border-gold/30 transition-all shadow-xl">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey 
                    && handleSend()}
                  placeholder="Transmit signal..."
                  className="flex-1 bg-transparent text-marble text-sm 
                    py-2 outline-none placeholder:text-marble/20 placeholder:micro-caps"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className={cn(
                    "w-9 h-9 rounded-full bg-marble text-void flex items-center justify-center shrink-0 transition-all",
                    "hover:bg-gold-pale hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center justify-center cursor-pointer"
                  )}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <p className="text-[9px] micro-caps text-marble/10 text-center mt-3 tracking-widest">
                END-TO-END ENCRYPTION ACTIVE — PROTOCOL AURA V1.0
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
