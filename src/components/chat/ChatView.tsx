'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { subscribeToChat, isSupabaseConfigured } from '@/lib/supabase'

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  message: string
  read: boolean
  createdAt: string
  senderName?: string
  senderType?: string
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  // Strip HTML tags and trim
  return input.replace(/<[^>]*>/g, '').trim()
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

export function ChatView() {
  const { user, token } = useAuthStore()
  const { chatSenderId, goBack } = useNavStore()
  const { t } = useLangStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages
  useEffect(() => {
    if (!user || !chatSenderId) {
      setLoading(false)
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/chat?senderId=${chatSenderId}&userId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (!res.ok) throw new Error('Failed to load messages')
        const data = await res.json()
        setMessages(data.messages || [])
      } catch {
        setError(t('failedLoadMessages'))
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Try Supabase Realtime first, fallback to polling
    let realtimeChannel: ReturnType<typeof subscribeToChat> | null = null
    let pollingInterval: ReturnType<typeof setInterval> | null = null

    if (isSupabaseConfigured()) {
      // Use Supabase Realtime
      realtimeChannel = subscribeToChat(user.id, (payload) => {
        const newMsg = payload.new as ChatMessage
        if (newMsg) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      })
    } else {
      // Fallback to polling every 5 seconds
      pollingInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/chat?senderId=${chatSenderId}&userId=${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          if (res.ok) {
            const data = await res.json()
            setMessages(data.messages || [])
          }
        } catch {
          // silently fail
        }
      }, 5000)
    }

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [user, chatSenderId, token])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatSenderId || sending) return

    const sanitized = sanitizeInput(newMessage)
    if (!sanitized) return

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: chatSenderId,
          message: sanitized,
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
      setNewMessage('')
      inputRef.current?.focus()
    } catch {
      setError(t('failedSendMessage'))
      setTimeout(() => setError(null), 3000)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFD700"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('pleaseSignIn')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('needLoginToChat')}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-7rem)] bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <span className="text-[#FFD700] font-bold text-sm">
              {chatSenderId === 'admin' ? 'CS' : (chatSenderId ? chatSenderId[0]?.toUpperCase() : 'S')}
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {chatSenderId === 'admin'
                ? t('customerSupport')
                : t('sellerChat')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {chatSenderId === 'admin'
                ? t('replyWithinMinutes')
                : (chatSenderId ? `ID: ${chatSenderId.slice(-8).toUpperCase()}` : t('noSellerSelected'))}
            </p>
          </div>
        </div>
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFD700]/10 transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-[#FFD700] animate-spin" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-[#FFD700] font-medium hover:underline"
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('noMessages')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender name */}
                        {!isMe && (
                          <span className="text-xs text-[#FFD700] font-medium mb-0.5 ml-1">
                            {msg.senderType === 'admin'
                              ? t('support')
                              : (msg.senderName || t('seller'))}
                          </span>
                        )}
                        {isMe && (
                          <span className="text-xs text-muted-foreground font-medium mb-0.5 mr-1">
                            {t('you')}
                          </span>
                        )}
                        {/* Message bubble */}
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#FFD700] text-[#0A0A0A] rounded-br-md'
                              : 'bg-card border border-border text-foreground rounded-bl-md'
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                        {/* Time */}
                        <span
                          className={`text-[10px] text-muted-foreground mt-0.5 ${
                            isMe ? 'mr-1' : 'ml-1'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Error Toast */}
      {error && messages.length > 0 && (
        <div className="px-4 py-2">
          <div className="text-xs text-center text-red-400 bg-red-500/10 rounded-lg py-1.5">
            {error}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            disabled={sending || !chatSenderId}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim() || !chatSenderId}
            className="w-10 h-10 rounded-xl bg-[#FFD700] flex items-center justify-center text-[#0A0A0A] disabled:opacity-40 hover:bg-[#FFE44D] transition-colors active:scale-95"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
