'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { sanitizePaymentInput, forceTransactionUppercase, formatBDPhone, checkoutPaymentSchema } from '@/lib/payment-validator'

const DEFAULT_DELIVERY_FEE = 60

type PaymentMethod = 'bkash' | 'nagad' | 'cod'

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; labelBN: string; color: string; bgColor: string }[] = [
  { id: 'bkash', label: 'bKash', labelBN: 'বিকাশ', color: '#E2136E', bgColor: 'rgba(226, 19, 110, 0.1)' },
  { id: 'nagad', label: 'Nagad', labelBN: 'নগদ', color: '#F6921E', bgColor: 'rgba(246, 146, 30, 0.1)' },
  { id: 'cod', label: 'Cash on Delivery', labelBN: 'ক্যাশ অন ডেলিভারি', color: '#006A4E', bgColor: 'rgba(0, 106, 78, 0.1)' },
]

interface FieldErrors {
  name?: string
  phone?: string
  address?: string
  zilla?: string
  upazila?: string
  home?: string
  paymentMethod?: string
  transactionId?: string
}

interface PaymentSettings {
  bkashNumber: string
  nagadNumber: string
  codDeliveryCharge: number
}

export function CheckoutView() {
  const { items, getTotal, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavStore((s) => s.navigate)

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [zilla, setZilla] = useState('')
  const [upazila, setUpazila] = useState('')
  const [gram, setGram] = useState('')
  const [home, setHome] = useState('')
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [transactionId, setTransactionId] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string
    total: number
    paymentMethod: PaymentMethod
  } | null>(null)

  // Payment settings from API
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bkashNumber: '0171-0000000',
    nagadNumber: '0181-0000000',
    codDeliveryCharge: 60,
  })

  // Copy button state
  const [copied, setCopied] = useState(false)

  // Fetch payment settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/payment')
        if (res.ok) {
          const data = await res.json()
          setPaymentSettings(data)
        }
      } catch {
        // Use defaults
      }
    }
    fetchSettings()
  }, [])

  const deliveryFee = paymentMethod === 'cod'
    ? paymentSettings.codDeliveryCharge
    : DEFAULT_DELIVERY_FEE

  const subtotal = getTotal()
  const total = subtotal > 0 ? subtotal + deliveryFee : 0

  const agentNumber = paymentMethod === 'bkash'
    ? paymentSettings.bkashNumber
    : paymentMethod === 'nagad'
    ? paymentSettings.nagadNumber
    : ''

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(agentNumber.replace(/-/g, ''))
      setCopied(true)
      toast.success('Number copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  // Not authenticated - redirect
  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 bg-background"
      >
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 className="text-lg font-bold text-foreground mb-2">Please login to checkout</h2>
          <p className="text-sm text-muted-foreground mb-4">You need an account to place orders</p>
          <button
            onClick={() => navigate('login')}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0A0A0A]"
          >
            Login Now
          </button>
        </div>
      </motion.div>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 bg-background"
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <h2 className="text-lg font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">Add some items before checkout</p>
        <button
          onClick={() => navigate('home')}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0A0A0A]"
        >
          Browse Products
        </button>
      </motion.div>
    )
  }

  const handleNameChange = (value: string) => {
    setName(sanitizePaymentInput(value))
    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
  }

  const handlePhoneChange = (value: string) => {
    setPhone(sanitizePaymentInput(value))
    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }))
  }

  const handleTransactionIdChange = (value: string) => {
    setTransactionId(forceTransactionUppercase(value))
    if (errors.transactionId) setErrors(prev => ({ ...prev, transactionId: undefined }))
  }

  const handleAddressChange = (value: string) => {
    // This is now unused, but kept for compatibility
  }

  // Get full address string from structured fields
  const getFullAddress = () => {
    const parts = [home, gram, upazila, zilla].filter(Boolean)
    let addr = parts.join(', ')
    if (liveLocation) {
      addr += ` [Location: ${liveLocation.lat.toFixed(6)}, ${liveLocation.lng.toFixed(6)}]`
    }
    return addr
  }

  // Fetch live location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
        toast.success('Location captured successfully!')
      },
      (error) => {
        setLocationLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please enable it in your browser settings.')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable.')
            break
          case error.TIMEOUT:
            toast.error('Location request timed out.')
            break
          default:
            toast.error('Failed to get location.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const validate = (): boolean => {
    const result = checkoutPaymentSchema.safeParse({
      name,
      phone,
      address: getFullAddress(),
      paymentMethod,
      transactionId: transactionId || undefined,
      note: note || undefined,
    })

    if (result.success) {
      setErrors({})
      // Additional validation for structured address
      const addrErrors: FieldErrors = {}
      if (!zilla.trim()) addrErrors.zilla = 'District (Zilla) is required'
      if (!upazila.trim()) addrErrors.upazila = 'Upazila is required'
      if (!home.trim()) addrErrors.home = 'Home/Holding number is required'
      if (Object.keys(addrErrors).length > 0) {
        setErrors(addrErrors)
        return false
      }
      return true
    }

    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          phone: formatBDPhone(phone),
          address: getFullAddress(),
          paymentMethod,
          transactionId: transactionId || undefined,
          note: note || undefined,
        }),
      })

      if (!orderRes.ok) {
        const orderData = await orderRes.json()
        throw new Error(orderData.error || 'Failed to place order')
      }

      const orderData = await orderRes.json()
      const orderId = orderData.order?.id?.slice(-8).toUpperCase() || 'N/A'

      // Send telegram alert (fire and forget - don't block on it)
      const itemsSummary = items.map(i => `${i.name} x${i.quantity}`).join(', ')
      fetch('/api/telegram-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: name,
          customerPhone: formatBDPhone(phone),
          amount: total,
          paymentMethod,
          transactionId: transactionId || undefined,
          items: itemsSummary,
        }),
      }).catch(() => {
        // Silently ignore telegram errors
      })

      // Clear cart and show success
      clearCart()
      setOrderSuccess({
        orderId: orderData.order?.id?.slice(-8).toUpperCase() || 'N/A',
        total,
        paymentMethod,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Order success screen
  if (orderSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-6 bg-background"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              d="M20 6L9 17l-5-5"
            />
          </motion.svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Order Placed!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground mb-6 text-center"
        >
          Your order has been placed successfully. We will process it shortly.
        </motion.p>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 mb-6"
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="text-sm font-mono font-bold text-foreground">#{orderSuccess.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-[#FFD700]">৳{orderSuccess.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <span className="text-sm font-medium text-foreground capitalize">{orderSuccess.paymentMethod}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          <button
            onClick={() => navigate('profile')}
            className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#FFD700] text-[#0A0A0A] hover:bg-[#FFE44D] transition-colors"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate('home')}
            className="px-6 py-3 rounded-xl text-sm font-semibold border border-border bg-card text-foreground hover:bg-[#FFD700]/5 transition-colors"
          >
            Continue Shopping
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-10 backdrop-blur-sm border-b border-border px-4 py-3 bg-background/95"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('cart')}
            className="p-1.5 rounded-lg transition-colors text-[#FFD700]"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-foreground">Checkout</h1>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-card"
        >
          <h2 className="text-base font-bold text-foreground mb-4">Order Summary</h2>

          <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
            {items.map((item) => {
              const effectivePrice = item.salePrice || item.price
              return (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-input">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0 ml-2">
                    ৳{(effectivePrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="text-foreground">৳{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-[#FFD700]">৳{total.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 bg-card"
        >
          <h2 className="text-base font-bold text-foreground mb-4">Customer Information</h2>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name <span className="text-[#f42a41]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background ${
                errors.name ? 'border border-[#f42a41]' : 'border border-border'
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1">English letters only (Bengali not supported in payment fields)</p>
            {errors.name && <p className="text-xs mt-1 text-[#f42a41]">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Phone Number <span className="text-[#f42a41]">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+880 1XXXXXXXXX"
              className={`w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background ${
                errors.phone ? 'border border-[#f42a41]' : 'border border-border'
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1">BD format: +880 or 01 prefix, max 11 digits after country code</p>
            {errors.phone && <p className="text-xs mt-1 text-[#f42a41]">{errors.phone}</p>}
          </div>

          {/* Address - Structured BD Format */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Delivery Address <span className="text-[#f42a41]">*</span>
            </label>

            {/* Zilla (District) */}
            <div className="mb-2">
              <input
                type="text"
                value={zilla}
                onChange={(e) => { setZilla(e.target.value); if (errors.zilla) setErrors(prev => ({ ...prev, zilla: undefined })) }}
                placeholder="জেলা / District (e.g. ঢাকা, চট্টগ্রাম)"
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background ${
                  errors.zilla ? 'border border-[#f42a41]' : 'border border-border'
                }`}
              />
              {errors.zilla && <p className="text-xs mt-1 text-[#f42a41]">{errors.zilla}</p>}
            </div>

            {/* Upazila */}
            <div className="mb-2">
              <input
                type="text"
                value={upazila}
                onChange={(e) => { setUpazila(e.target.value); if (errors.upazila) setErrors(prev => ({ ...prev, upazila: undefined })) }}
                placeholder="উপজেলা / Upazila (e.g. সদর, মিরপুর)"
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background ${
                  errors.upazila ? 'border border-[#f42a41]' : 'border border-border'
                }`}
              />
              {errors.upazila && <p className="text-xs mt-1 text-[#f42a41]">{errors.upazila}</p>}
            </div>

            {/* Gram (Village/Area) */}
            <div className="mb-2">
              <input
                type="text"
                value={gram}
                onChange={(e) => setGram(e.target.value)}
                placeholder="গ্রাম/এলাকা / Village/Area (optional)"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background border border-border"
              />
            </div>

            {/* Home/Holding */}
            <div className="mb-2">
              <input
                type="text"
                value={home}
                onChange={(e) => { setHome(e.target.value); if (errors.home) setErrors(prev => ({ ...prev, home: undefined })) }}
                placeholder="বাড়ি/হোল্ডিং / Home & Holding No. *"
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background ${
                  errors.home ? 'border border-[#f42a41]' : 'border border-border'
                }`}
              />
              {errors.home && <p className="text-xs mt-1 text-[#f42a41]">{errors.home}</p>}
            </div>

            {/* Live Location */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-[#FFD700]/40 bg-[#FFD700]/5 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors disabled:opacity-50"
              >
                {locationLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Getting Location...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {liveLocation ? 'Update Live Location' : 'Add Live Location'}
                  </>
                )}
              </button>
              {liveLocation && (
                <p className="text-xs text-green-500 mt-1 text-center">
                  Location captured: {liveLocation.lat.toFixed(4)}, {liveLocation.lng.toFixed(4)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 text-center">
                This uses your device GPS for accurate delivery location
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Order Note <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special instructions?"
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors bg-background border border-border"
            />
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 bg-card"
        >
          <h2 className="text-base font-bold text-foreground mb-4">Payment Method</h2>

          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = paymentMethod === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(option.id)
                    if (errors.paymentMethod) setErrors(prev => ({ ...prev, paymentMethod: undefined }))
                  }}
                  className="relative rounded-xl p-3 text-center transition-all duration-200"
                  style={{
                    backgroundColor: option.bgColor,
                    border: isSelected ? `2px solid #FFD700` : `2px solid transparent`,
                  }}
                  aria-label={`Select ${option.label} payment`}
                >
                  {isSelected && (
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#FFD700' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.id === 'bkash' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    )}
                    {option.id === 'nagad' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    )}
                    {option.id === 'cod' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-bold" style={{ color: option.color }}>{option.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{option.labelBN}</p>
                </button>
              )
            })}
          </div>

          {/* COD Notice */}
          {paymentMethod === 'cod' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-xl p-3 bg-amber-500/10 border border-amber-500/20"
            >
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Cash on Delivery: ৳{paymentSettings.codDeliveryCharge} delivery charge will be added
              </p>
            </motion.div>
          )}

          {errors.paymentMethod && <p className="text-xs mt-2 text-[#f42a41]">{errors.paymentMethod}</p>}
        </motion.div>

        {/* Transaction ID (only for bKash/Nagad) */}
        {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 bg-card"
          >
            <h2 className="text-base font-bold text-foreground mb-1">Transaction Details</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Send ৳{total.toLocaleString()} to {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number and enter the transaction ID below
            </p>

            {/* Payment instructions */}
            <div
              className="rounded-xl p-3 mb-4 text-xs space-y-1"
              style={{ backgroundColor: paymentMethod === 'bkash' ? 'rgba(226, 19, 110, 0.08)' : 'rgba(246, 146, 30, 0.08)' }}
            >
              <p className="text-foreground">
                <span className="font-semibold">Step 1:</span> Open {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app
              </p>
              <p className="text-foreground">
                <span className="font-semibold">Step 2:</span> Send Money to{' '}
                <span className="font-mono font-bold inline-flex items-center gap-1.5" style={{ color: paymentMethod === 'bkash' ? '#E2136E' : '#F6921E' }}>
                  {agentNumber}
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
                    aria-label="Copy number"
                    title="Copy number"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" style={{ color: paymentMethod === 'bkash' ? '#E2136E' : '#F6921E' }} />
                    )}
                  </button>
                </span>
              </p>
              <p className="text-foreground">
                <span className="font-semibold">Step 3:</span> Enter the Transaction ID below
              </p>
            </div>

            <label className="block text-sm font-medium text-foreground mb-1.5">
              Transaction ID <span className="text-[#f42a41]">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => handleTransactionIdChange(e.target.value)}
              placeholder="e.g. BKASH123456"
              className={`w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none transition-colors uppercase font-mono tracking-wider bg-background ${
                errors.transactionId ? 'border border-[#f42a41]' : 'border border-border'
              }`}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground mt-1">Only uppercase letters and numbers</p>
            {errors.transactionId && <p className="text-xs mt-1 text-[#f42a41]">{errors.transactionId}</p>}
          </motion.div>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pb-24"
        >
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base bg-[#FFD700] text-[#0A0A0A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Placing Order...
              </span>
            ) : (
              `Place Order — ৳${total.toLocaleString()}`
            )}
          </button>
        </motion.div>
      </form>
    </div>
  )
}
