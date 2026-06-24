'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, ArrowLeft, ImageIcon, Smile, Pencil, Trash2, Check } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { subscribeToChat, subscribeToTyping, broadcastTyping, isSupabaseConfigured } from '@/lib/supabase'

interface ChatUser {
  id: string
  name: string | null
  avatar: string | null
  email: string
}

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string | null
  message: string
  read: boolean
  createdAt: string
  senderName?: string
  senderType?: string
  sender?: ChatUser
}

interface ChatConversation {
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  senderType: string
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
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

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// ─── Emoji Picker ────────────────────────────────────────────────────────
const EMOJI_LIST = [
  '😀','😂','🥰','😍','😘','😊','🤗','🤔','😢','😭',
  '😡','👍','👎','❤️','🔥','✨','🎉','🙏','💪','👋',
  '🤝','💯','🥳','😎','🤩','😴','🤮','🥶','🤯','🫡',
  '😤','😈','💀','🤡','👻','👏','🤲','✅','❌','⭐',
  '🌟','💬','📢','📌','🛍️','💰','🎁','🎊','🎈','🎯',
  '🚀','⏰','📱','💡',
]

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 p-3 bg-card border-[2px] border-foreground shadow-[4px_4px_0px_var(--foreground)] rounded-lg z-50 w-72 max-w-[calc(100vw-2rem)]"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#FFD700]/20 rounded transition-colors active:scale-90"
            aria-label={`Emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Message Context Menu ──────────────────────────────────────────────────
function MessageContextMenu({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: {
  x: number
  y: number
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Adjust position so menu doesn't go off-screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 160),
    top: Math.min(y, window.innerHeight - 100),
    zIndex: 60,
  }

  return (
    <div ref={menuRef} style={menuStyle}>
      <div className="bg-card border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)] rounded-lg overflow-hidden min-w-[140px]">
        <button
          onClick={() => {
            onEdit()
            onClose()
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-[#FFD700]/10 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <div className="h-[2px] bg-foreground/20" />
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Conversation List View ────────────────────────────────────────────────
function ConversationList({
  conversations,
  onSelect,
  loading,
}: {
  conversations: ChatConversation[]
  onSelect: (userId: string) => void
  loading: boolean
}) {
  const { t } = useLangStore()
  const { user } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-[#FFD700] animate-spin" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground text-center">{t('noMessages')}</p>
        <button
          onClick={() => onSelect('admin')}
          className="nb-btn mt-4 bg-[#FFD700] text-[#0A0A0A]"
        >
          {t('contactSupport')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.otherUserId}
          onClick={() => onSelect(conv.otherUserId)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b-[2px] border-foreground/20 hover:bg-[#FFD700]/10 transition-colors text-left"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {conv.otherUserAvatar ? (
              <img
                src={conv.otherUserAvatar}
                alt={conv.otherUserName}
                className="w-12 h-12 rounded-full object-cover border-[2px] border-foreground"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)]">
                <span className="text-[#FFD700] font-black text-sm">
                  {conv.otherUserId === 'admin'
                    ? 'CS'
                    : (conv.otherUserName?.[0]?.toUpperCase() || 'U')}
                </span>
              </div>
            )}
            {/* Online indicator (always show for admin) */}
            {conv.otherUserId === 'admin' && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#22C55E] rounded-full border-2 border-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground truncate">
                {conv.otherUserId === 'admin' ? t('customerSupport') : conv.otherUserName}
              </h3>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-bold">
                {formatRelativeTime(conv.lastMessageTime)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-muted-foreground truncate">
                {conv.senderType === 'admin' ? '' : t('you') + ': '}{conv.lastMessage}
              </p>
              {conv.unreadCount > 0 && (
                <span className="nb-badge ml-2 shrink-0 bg-[#22C55E] text-white">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Chat Room View ────────────────────────────────────────────────────────
function ChatRoom({
  otherUserId,
  onBack,
}: {
  otherUserId: string
  onBack: () => void
}) {
  const { user, token } = useAuthStore()
  const { t } = useLangStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isOtherOnline, setIsOtherOnline] = useState(otherUserId === 'admin')

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Context menu state (long-press / right-click)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    messageId: string
  } | null>(null)

  // Inline edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch other user info
  useEffect(() => {
    if (otherUserId === 'admin') {
      setOtherUser({ id: 'admin', name: 'Customer Support', avatar: null, email: 'admin@banglabazar.com' })
      return
    }
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/chat?action=user_info&userId=${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setOtherUser(data.user || null)
        }
      } catch {
        // ignore
      }
    }
    fetchUser()
  }, [otherUserId, token])

  // Fetch messages
  useEffect(() => {
    if (!user || !otherUserId) {
      setLoading(false)
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/chat?senderId=${otherUserId}&userId=${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
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

    // Supabase Realtime subscription
    let realtimeChannel: ReturnType<typeof subscribeToChat> | null = null
    let typingChannel: ReturnType<typeof subscribeToTyping> | null = null
    let pollingInterval: ReturnType<typeof setInterval> | null = null

    if (isSupabaseConfigured()) {
      realtimeChannel = subscribeToChat(user.id, (payload) => {
        const newMsg = payload.new as ChatMessage
        if (newMsg && (newMsg.senderId === otherUserId || newMsg.receiverId === otherUserId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      })

      // Subscribe to typing indicators
      typingChannel = subscribeToTyping(user.id, (payload) => {
        const { senderId, isTyping: typing } = payload as { senderId: string; isTyping: boolean }
        if (senderId === otherUserId) {
          setIsTyping(typing)
          // Auto-clear typing after 3s
          if (typing) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
          }
        }
      })
    } else {
      // Fallback to polling every 5 seconds
      pollingInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/chat?senderId=${otherUserId}&userId=${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
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
      if (realtimeChannel) realtimeChannel.unsubscribe()
      if (typingChannel) typingChannel.unsubscribe()
      if (pollingInterval) clearInterval(pollingInterval)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [user, otherUserId, token, t])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Mark messages as read
  useEffect(() => {
    if (!user || !otherUserId || messages.length === 0) return
    const unreadMessages = messages.filter(
      (m) => m.senderId === otherUserId && !m.read
    )
    if (unreadMessages.length > 0) {
      fetch('/api/chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'mark_read',
          senderId: otherUserId,
          receiverId: user.id,
        }),
      }).catch(() => {})
    }
  }, [messages, user, otherUserId, token])

  // Broadcast typing
  const handleInputChange = (value: string) => {
    setNewMessage(value)
    if (isSupabaseConfigured() && user && otherUserId) {
      broadcastTyping(user.id, otherUserId, value.length > 0)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !otherUserId || sending) return

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
          receiverId: otherUserId,
          message: sanitized,
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
      setNewMessage('')
      inputRef.current?.focus()

      // Clear typing indicator
      if (isSupabaseConfigured() && user) {
        broadcastTyping(user.id, otherUserId, false)
      }
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

  // Emoji insert
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, messageId: string, isMe: boolean) => {
    if (!isMe) return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, messageId })
  }

  const handleTouchStart = (messageId: string, isMe: boolean) => {
    if (!isMe) return
    longPressTimerRef.current = setTimeout(() => {
      // Use a fixed position near center for touch
      setContextMenu({
        x: window.innerWidth / 2 - 70,
        y: window.innerHeight / 2 - 50,
        messageId,
      })
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user || !token) return
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId, userId: user.id }),
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    } catch {
      // silently fail
    }
  }

  // Start editing a message
  const handleStartEdit = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId)
    setEditText(currentText)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  // Save edited message
  const handleSaveEdit = async (messageId: string) => {
    if (!user || !token) return
    const sanitized = sanitizeInput(editText)
    if (!sanitized) return
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId, userId: user.id, message: sanitized }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, message: data.message.message } : m))
        )
      }
    } catch {
      // silently fail
    }
    setEditingMessageId(null)
    setEditText('')
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditText('')
  }

  const displayName = otherUserId === 'admin'
    ? t('customerSupport')
    : (otherUser?.name || otherUserId.slice(-8).toUpperCase())

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-[calc(100vh-7rem)] bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-[3px] border-foreground bg-card shadow-[0_3px_0_0_var(--foreground)]">
        <button
          onClick={onBack}
          className="nb-btn-sm bg-card text-foreground"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="relative">
          {otherUser?.avatar ? (
            <img
              src={otherUser.avatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)]">
              <span className="text-[#FFD700] font-black text-sm">
                {otherUserId === 'admin' ? 'CS' : (displayName[0]?.toUpperCase() || 'U')}
              </span>
            </div>
          )}
          {isOtherOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="text-[#22C55E] font-bold flex items-center gap-1">
                typing
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </span>
            ) : isOtherOnline ? (
              <span className="text-[#22C55E] font-bold">Online</span>
            ) : (
              t('replyWithinMinutes')
            )}
          </p>
        </div>

        <button
          onClick={onBack}
          className="nb-btn-sm bg-card text-foreground"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
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
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3 border-[2px] border-foreground shadow-[3px_3px_0px_var(--foreground)] bg-[#FFD700]/10"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground font-black">{t('noMessages')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        onContextMenu={(e) => handleContextMenu(e, msg.id, isMe)}
                        onTouchStart={() => handleTouchStart(msg.id, isMe)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                      >
                        {/* Sender info */}
                        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {!isMe && (
                            <span className="text-xs text-[#FFD700] font-medium ml-1">
                              {msg.senderType === 'admin' ? t('support') : (msg.senderName || t('seller'))}
                            </span>
                          )}
                          {isMe && (
                            <span className="text-xs text-muted-foreground font-medium mr-1">
                              {t('you')}
                            </span>
                          )}
                        </div>
                        {/* Message bubble */}
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed font-medium ${
                            isMe
                              ? 'bg-[#FFD700] text-[#0A0A0A] border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)]'
                              : 'bg-card text-foreground border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)]'
                          } ${isMe ? 'cursor-pointer select-none' : ''}`}
                        >
                          {editingMessageId === msg.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveEdit(msg.id)
                                  }
                                  if (e.key === 'Escape') {
                                    handleCancelEdit()
                                  }
                                }}
                                className="flex-1 bg-background text-foreground px-2 py-1 rounded border-[2px] border-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 min-w-0"
                              />
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="p-1 hover:bg-[#0A0A0A]/10 rounded transition-colors"
                                aria-label="Save edit"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 hover:bg-[#0A0A0A]/10 rounded transition-colors"
                                aria-label="Cancel edit"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <p className="break-words">{msg.message}</p>
                          )}
                        </div>
                        {/* Time + read status */}
                        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-muted-foreground font-bold">
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-start"
                    >
                      <div className="bg-card border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] rounded-xl px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
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

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onEdit={() => {
              const msg = messages.find((m) => m.id === contextMenu.messageId)
              if (msg) handleStartEdit(msg.id, msg.message)
            }}
            onDelete={() => handleDeleteMessage(contextMenu.messageId)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t-[3px] border-foreground bg-card px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Emoji button - LEFT side */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-card text-foreground hover:bg-[#FFD700]/10 active:scale-95 border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] transition-all"
              aria-label="Open emoji picker"
            >
              <Smile className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Input - takes full available width */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            disabled={sending}
            className="nb-input flex-1 min-w-0 px-3 sm:px-4 py-3 bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700] disabled:opacity-50"
          />

          {/* Send button - RIGHT side */}
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-[#FFD700] text-[#0A0A0A] disabled:opacity-40 active:scale-90 border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Chat View ────────────────────────────────────────────────────────
export function ChatView() {
  const { user, token } = useAuthStore()
  const { chatSenderId, goBack } = useNavStore()
  const { t } = useLangStore()

  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(chatSenderId || null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)

  // Fetch conversations list
  useEffect(() => {
    if (!user) {
      setConversationsLoading(false)
      return
    }

    const fetchConversations = async () => {
      setConversationsLoading(true)
      try {
        const res = await fetch(`/api/chat?action=conversations&userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
        }
      } catch {
        // Use fallback
      } finally {
        setConversationsLoading(false)
      }
    }

    fetchConversations()
  }, [user, token])

  // If chatSenderId is provided from nav, open that chat directly
  useEffect(() => {
    if (chatSenderId) {
      setActiveChatUserId(chatSenderId)
    }
  }, [chatSenderId])

  const handleSelectConversation = (userId: string) => {
    setActiveChatUserId(userId)
  }

  const handleBackToList = () => {
    setActiveChatUserId(null)
    // Refresh conversations when going back
    if (user) {
      fetch(`/api/chat?action=conversations&userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setConversations(data.conversations || []))
        .catch(() => {})
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">{t('pleaseSignIn')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('needLoginToChat')}</p>
        </motion.div>
      </div>
    )
  }

  // Active chat room
  if (activeChatUserId) {
    return <ChatRoom otherUserId={activeChatUserId} onBack={handleBackToList} />
  }

  // Conversation list
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-7rem)] bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-foreground bg-card shadow-[0_3px_0_0_var(--foreground)]">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="nb-btn-sm bg-card text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-black text-foreground">{t('chat')}</h2>
        </div>
        <button
          onClick={() => setActiveChatUserId('admin')}
          className="nb-btn-sm bg-[#FFD700] text-[#0A0A0A]"
        >
          {t('contactSupport')}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b-[2px] border-foreground/20">
        <input
          type="text"
          placeholder={t('searchProducts')}
          className="nb-input w-full px-4 py-2.5 bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700]"
        />
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          loading={conversationsLoading}
        />
      </ScrollArea>
    </motion.div>
  )
}
