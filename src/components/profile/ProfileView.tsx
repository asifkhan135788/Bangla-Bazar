'use client'

import { useState, useEffect, useRef } from 'react'
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
  Camera,
  Trash2,
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#FFD700', text: '#1A1A1A', border: '#1A1A1A' },
  confirmed: { bg: '#22C55E', text: '#1A1A1A', border: '#1A1A1A' },
  processing: { bg: '#A855F7', text: '#FFFFFF', border: '#1A1A1A' },
  shipped: { bg: '#06b6d4', text: '#FFFFFF', border: '#1A1A1A' },
  delivered: { bg: '#22c55e', text: '#FFFFFF', border: '#1A1A1A' },
  cancelled: { bg: '#EF4444', text: '#FFFFFF', border: '#1A1A1A' },
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
  const [editZilla, setEditZilla] = useState('')
  const [editUpazila, setEditUpazila] = useState('')
  const [editGram, setEditGram] = useState('')
  const [editHome, setEditHome] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
          <div className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center bg-[#22C55E] border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)]">
            <User className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-lg font-black text-foreground uppercase tracking-wide">
            {t('signInToAccount')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
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
    // Try to parse address as structured JSON
    let parsedAddr = { zilla: '', upazila: '', gram: '', home: '', raw: '' }
    if (user.address) {
      try {
        const parsed = JSON.parse(user.address)
        if (parsed && typeof parsed === 'object' && parsed.zilla !== undefined) {
          parsedAddr = parsed
        } else {
          parsedAddr.raw = user.address
        }
      } catch {
        parsedAddr.raw = user.address
      }
    }
    setEditAddress(parsedAddr.raw || '')
    setEditZilla(parsedAddr.zilla || '')
    setEditUpazila(parsedAddr.upazila || '')
    setEditGram(parsedAddr.gram || '')
    setEditHome(parsedAddr.home || '')
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'নাম আবশ্যক')
      return
    }
    setEditLoading(true)
    try {
      // Build structured address as JSON if any structured field is filled
      const hasStructured = editZilla.trim() || editUpazila.trim() || editGram.trim() || editHome.trim()
      let addressToSave = editAddress.trim()
      if (hasStructured) {
        const structuredAddr = JSON.stringify({
          zilla: editZilla.trim(),
          upazila: editUpazila.trim(),
          gram: editGram.trim(),
          home: editHome.trim(),
        })
        addressToSave = structuredAddr
      }

      // Persist to server
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          userId: user.id,
          name: editName.trim(),
          phone: editPhone.trim(),
          address: addressToSave,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update local store
      updateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
        address: addressToSave,
      })
      setEditing(false)
      toast.success(t('profileUpdated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error(language === 'en' ? 'Only JPEG, PNG, WebP, and GIF images are allowed' : 'শুধুমাত্র JPEG, PNG, WebP এবং GIF ছবি অনুমোদিত')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'en' ? 'Image must be less than 2MB' : 'ছবি ২MB এর কম হতে হবে')
      return
    }

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('userId', user.id)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      // Safely parse response - handle HTML error pages
      let data: any
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        // Response is not JSON (likely HTML error page)
        if (!res.ok) {
          throw new Error(language === 'en' ? 'Upload failed. Please try again.' : 'আপলোড ব্যর্থ। আবার চেষ্টা করুন।')
        }
        throw new Error(language === 'en' ? 'Unexpected server response' : 'অপ্রত্যাশিত সার্ভার রেসপন্স')
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed')
      }

      updateUser({ avatar: data.avatarUrl })
      toast.success(language === 'en' ? 'Profile picture updated!' : 'প্রোফাইল ছবি আপডেট হয়েছে!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error'))
    } finally {
      setAvatarUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAvatarDelete = async () => {
    setAvatarUploading(true)
    try {
      const res = await fetch(`/api/upload/avatar?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to remove avatar')
      }

      updateUser({ avatar: null })
      toast.success(language === 'en' ? 'Profile picture removed' : 'প্রোফাইল ছবি মুছে ফেলা হয়েছে')
    } catch {
      toast.error(t('error'))
    } finally {
      setAvatarUploading(false)
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
    return t(status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled')
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
        className="nb-card bg-card p-5 mb-4"
      >
        <div className="flex items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'Profile'}
                className="w-16 h-16 rounded-full object-cover border-[3px] border-foreground shadow-[3px_3px_0px_var(--foreground)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-[#0A0A0A] text-2xl font-black border-[3px] border-foreground bg-[#FFD700] shadow-[3px_3px_0px_var(--foreground)]">
                {userInitial}
              </div>
            )}

            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFD700] border-2 border-foreground flex items-center justify-center text-[#0A0A0A] shadow-[2px_2px_0px_var(--foreground)] hover:brightness-110 transition disabled:opacity-50"
              aria-label="Change profile picture"
            >
              {avatarUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Delete avatar button */}
            {user.avatar && (
              <button
                onClick={handleAvatarDelete}
                disabled={avatarUploading}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#EF4444] border-2 border-foreground flex items-center justify-center text-white shadow-[2px_2px_0px_var(--foreground)] hover:brightness-110 transition disabled:opacity-50"
                aria-label="Remove profile picture"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
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
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="nb-input w-full px-3 py-2 text-sm bg-muted/50 cursor-not-allowed opacity-70"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                    {language === 'en' ? 'Email cannot be changed' : 'ইমেইল পরিবর্তন করা যাবে না'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {language === 'en' ? 'District (Zilla)' : 'জেলা'}
                  </label>
                  <input
                    type="text"
                    value={editZilla}
                    onChange={(e) => setEditZilla(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Dhaka, Chittagong' : 'যেমন: ঢাকা, চট্টগ্রাম'}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {language === 'en' ? 'Upazila' : 'উপজেলা'}
                  </label>
                  <input
                    type="text"
                    value={editUpazila}
                    onChange={(e) => setEditUpazila(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Mirpur, Sadar' : 'যেমন: মিরপুর, সদর'}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {language === 'en' ? 'Village/Area' : 'গ্রাম/এলাকা'}
                  </label>
                  <input
                    type="text"
                    value={editGram}
                    onChange={(e) => setEditGram(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Rupnagar (optional)' : 'যেমন: রূপনগর (ঐচ্ছিক)'}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {language === 'en' ? 'Home/Holding No.' : 'বাড়ি/হোল্ডিং নং'}
                  </label>
                  <input
                    type="text"
                    value={editHome}
                    onChange={(e) => setEditHome(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. 12/3A' : 'যেমন: ১২/৩এ'}
                    className="nb-input w-full px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="nb-btn-sm bg-[#FFD700] text-[#0A0A0A] px-4 py-2 text-sm font-black uppercase disabled:opacity-50"
                  >
                    {editLoading ? t('saving') : t('save')}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="nb-btn-sm px-4 py-2 text-sm font-bold text-foreground bg-input/50"
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
                  <h2 className="text-lg font-black text-foreground truncate">
                    {user.name || 'User'}
                  </h2>
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-md border-2 border-foreground bg-[#22C55E]/20 hover:bg-[#22C55E]/40 transition-colors shadow-[2px_2px_0px_var(--foreground)]"
                    aria-label={t('editProfile')}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#22C55E]" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground truncate font-semibold">{user.email}</p>
                {user.phone && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{user.phone}</p>
                )}
                {user.address && (() => {
                  try {
                    const parsed = JSON.parse(user.address)
                    if (parsed && typeof parsed === 'object' && parsed.zilla !== undefined) {
                      const parts = [parsed.home, parsed.gram, parsed.upazila, parsed.zilla].filter(Boolean)
                      return <p className="text-xs text-muted-foreground truncate font-semibold">{parts.join(', ')}</p>
                    }
                  } catch {
                    // Not JSON, show raw
                  }
                  return <p className="text-xs text-muted-foreground truncate font-semibold">{user.address}</p>
                })()}
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
        className="nb-card bg-card p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">{t('orderHistory')}</h3>
          {orders.length > 0 && (
            <button
              onClick={() => navigate('orders')}
              className="text-xs text-[#22C55E] font-bold hover:underline"
            >
              {t('viewAll')}
            </button>
          )}
        </div>

        {ordersLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-3 rounded-xl border-[2px] border-foreground/30">
                <div className="flex justify-between">
                  <div className="h-4 bg-input rounded w-1/3" />
                  <div className="h-5 bg-input rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 font-semibold">{t('noOrders')}</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => {
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              return (
                <div
                  key={order.id}
                  className="p-3 rounded-xl border-[2px] border-foreground flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground font-bold">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="nb-chip"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-sm font-black text-[#FFD700]">
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
        className="nb-card-static bg-card overflow-hidden mb-4"
      >
        <div className="px-5 py-3 border-b-[3px] border-foreground">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">{t('appSettings')}</h3>
        </div>
        <div>
          {settingsItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFD700]/5 transition-colors text-left ${
                idx < settingsItems.length - 1 ? 'border-b-[2px] border-foreground/20' : ''
              }`}
            >
              <span className="text-[#22C55E] shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground font-semibold">{item.subtitle}</p>
                )}
              </div>
              {item.toggle ? (
                <div
                  className="relative w-11 h-6 rounded-xl transition-colors duration-200 shrink-0 border-2 border-foreground shadow-[2px_2px_0px_var(--foreground)]"
                  style={{
                    backgroundColor: item.toggleValue ? '#FFD700' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-md bg-white border-2 border-foreground shadow-[1px_1px_0px_var(--foreground)] transition-all duration-200"
                    style={{
                      left: item.toggleValue ? 'calc(100% - 20px)' : '3px',
                    }}
                  />
                </div>
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground shrink-0 font-bold" />
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
          className="nb-btn w-full py-3 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center gap-2 font-black uppercase"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </motion.div>

      {/* App version */}
      <p className="text-center text-[10px] text-muted-foreground mt-4 font-semibold">
        {t('appName')} • {t('version')} 1.0.0
      </p>
    </div>
  )
}
