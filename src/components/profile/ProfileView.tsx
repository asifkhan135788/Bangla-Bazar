'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  Package,
  MessageCircle,
  Moon,
  Sun,
  Globe,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Pencil,
  X,
  Loader2,
  FileText,
  Info,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  orderItems: { id: string }[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(255, 215, 0, 0.15)', text: '#FFD700' },
  confirmed: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  processing: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
  shipped: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' },
  delivered: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  cancelled: { bg: 'rgba(244, 42, 65, 0.15)', text: '#f42a41' },
}

export function ProfileView() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore()
  const navigate = useNavStore((s) => s.navigate)
  const { t, language, setLanguage } = useLangStore()
  const { resolvedTheme, setTheme } = useTheme()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch {
        // silently fail
      } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()
  }, [isAuthenticated, user])

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-6 bg-background"
      >
        <div className="text-center mb-6 px-4">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
          >
            <User className="h-9 w-9 text-[#FFD700]" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('signInToAccount')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('accessOrdersProfile')}
          </p>
        </div>
        <LoginForm />
      </motion.div>
    )
  }

  const userInitial = (user.name || user.email)[0]?.toUpperCase() || 'U'
  const isDark = mounted ? resolvedTheme === 'dark' : true

  const handleStartEdit = () => {
    setEditName(user.name || '')
    setEditPhone(user.phone || '')
    setEditAddress(user.address || '')
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'নাম আবশ্যক')
      return
    }
    setEditLoading(true)
    try {
      updateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      })
      setEditing(false)
      toast.success(t('profileUpdated'))
    } catch {
      toast.error(t('error'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('home')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const statusLabel = (status: string) => {
    const key = status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    return t(key)
  }

  // Settings items
  const settingsItems = [
    {
      icon: <Package className="h-5 w-5" />,
      label: t('myOrders'),
      subtitle: orders.length > 0 ? `${orders.length} ${t('orders')}` : t('noOrders'),
      onClick: () => navigate('orders'),
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: t('chatWithSeller'),
      subtitle: t('customerSupport'),
      onClick: () => navigate('chat', { senderId: 'admin' }),
    },
    {
      icon: isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />,
      label: t('appearance'),
      subtitle: isDark ? t('darkMode') : t('lightMode'),
      onClick: () => setTheme(isDark ? 'light' : 'dark'),
      toggle: true,
      toggleValue: isDark,
    },
    {
      icon: <Globe className="h-5 w-5" />,
      label: t('language'),
      subtitle: language === 'en' ? 'English' : 'বাংলা',
      onClick: () => setLanguage(language === 'en' ? 'bn' : 'en'),
      toggle: true,
      toggleValue: language === 'bn',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: t('privacyPolicy'),
      onClick: () => navigate('privacy'),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: t('termsConditions'),
      onClick: () => navigate('terms'),
    },
    {
      icon: <Info className="h-5 w-5" />,
      label: t('about'),
      onClick: () => navigate('about'),
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: t('helpCenter'),
      onClick: () => navigate('chat', { senderId: 'admin' }),
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 bg-background min-h-screen">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[#0A0A0A] text-2xl font-bold shrink-0 border-2 border-[#FFD700] bg-[#FFD700]">
            {userInitial}
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 space-y-2"
              >
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('address')}
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 focus:border-[#FFD700]"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 bg-[#FFD700] text-[#0A0A0A]"
                  >
                    {editLoading ? t('saving') : t('save')}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-lg text-muted-foreground text-sm font-medium bg-input hover:bg-input/80 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {user.name || 'User'}
                  </h2>
                  <button
                    onClick={handleStartEdit}
                    className="p-1 rounded-md hover:bg-[#FFD700]/10 transition-colors"
                    aria-label={t('editProfile')}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#FFD700]" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.phone && (
                  <p className="text-xs text-muted-foreground mt-0.5">{user.phone}</p>
                )}
                {user.address && (
                  <p className="text-xs text-muted-foreground truncate">{user.address}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Recent Orders Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{t('orderHistory')}</h3>
          {orders.length > 0 && (
            <button
              onClick={() => navigate('orders')}
              className="text-xs text-[#FFD700] font-medium"
            >
              {t('viewAll')}
            </button>
          )}
        </div>

        {ordersLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-3 rounded-xl border border-border">
                <div className="flex justify-between">
                  <div className="h-4 bg-input rounded w-1/3" />
                  <div className="h-5 bg-input rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('noOrders')}</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => {
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              return (
                <div
                  key={order.id}
                  className="p-3 rounded-xl border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-sm font-bold text-[#FFD700]">
                      ৳{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Settings List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border overflow-hidden mb-4"
      >
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">{t('appSettings')}</h3>
        </div>
        <div>
          {settingsItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFD700]/5 transition-colors text-left border-b border-border last:border-b-0"
            >
              <span className="text-[#FFD700] shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
              {item.toggle ? (
                <div
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
                  style={{
                    backgroundColor: item.toggleValue ? '#FFD700' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
                    style={{
                      left: item.toggleValue ? 'calc(100% - 22px)' : '2px',
                    }}
                  />
                </div>
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border-2 text-sm font-semibold transition-colors hover:bg-red-500/10 border-[#f42a41] text-[#f42a41] flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </motion.div>

      {/* App version */}
      <p className="text-center text-[10px] text-muted-foreground mt-4">
        {t('appName')} • {t('version')} 1.0.0
      </p>
    </div>
  )
}
