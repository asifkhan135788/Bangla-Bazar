'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  ShoppingBag,
  MapPin,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useCartStore, type CartItem } from '@/store/cart-store'
import { useLangStore } from '@/store/lang-store'

interface OrderItem {
  id: string
  productId: string
  name: string
  quantity: number
  price: number
  image: string | null
}

interface Order {
  id: string
  total: number
  status: string
  address: string | null
  phone: string | null
  paymentMethod: string
  transactionId: string | null
  note: string | null
  createdAt: string
  orderItems: OrderItem[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#FFD700', text: '#1A1A1A', border: '#1A1A1A' },
  confirmed: { bg: '#22C55E', text: '#1A1A1A', border: '#1A1A1A' },
  processing: { bg: '#A855F7', text: '#FFFFFF', border: '#1A1A1A' },
  shipped: { bg: '#06b6d4', text: '#FFFFFF', border: '#1A1A1A' },
  delivered: { bg: '#22c55e', text: '#FFFFFF', border: '#1A1A1A' },
  cancelled: { bg: '#EF4444', text: '#FFFFFF', border: '#1A1A1A' },
}

const PAYMENT_LABELS: Record<string, { en: string; bn: string }> = {
  cod: { en: 'Cash on Delivery', bn: 'ক্যাশ অন ডেলিভারি' },
  bkash: { en: 'bKash', bn: 'বিকাশ' },
  nagad: { en: 'Nagad', bn: 'নগদ' },
  rocket: { en: 'Rocket', bn: 'রকেট' },
  card: { en: 'Card', bn: 'কার্ড' },
}

export function OrdersView() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavStore((s) => s.navigate)
  const { t, language } = useLangStore()
  const addItem = useCartStore((s) => s.addItem)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [reordering, setReordering] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch {
        toast.error(t('error'))
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [isAuthenticated, user, t])

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

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const statusLabel = (status: string) => {
    return t(status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled')
  }

  const paymentLabel = (method: string) => {
    const labels = PAYMENT_LABELS[method]
    return labels ? (language === 'bn' ? labels.bn : labels.en) : method
  }

  const handleReorder = async (order: Order) => {
    setReordering(order.id)
    try {
      let addedCount = 0
      for (const item of order.orderItems) {
        // Fetch product to get current price/stock
        const res = await fetch(`/api/products/${item.productId}`)
        if (res.ok) {
          const product = await res.json()
          if (product && product.active && product.stock > 0) {
            addItem({
              id: item.id,
              productId: item.productId,
              name: item.name,
              nameBN: product.nameBN || undefined,
              price: Number(product.price),
              salePrice: product.salePrice ? Number(product.salePrice) : undefined,
              image: product.images?.[0] || undefined,
              quantity: Math.min(item.quantity, product.stock),
              stock: product.stock,
            })
            addedCount++
          }
        }
      }
      if (addedCount > 0) {
        toast.success(
          language === 'en'
            ? `${addedCount} item(s) added to cart!`
            : `${addedCount} টি আইটেম কার্টে যোগ হয়েছে!`
        )
        navigate('cart')
      } else {
        toast.error(
          language === 'en'
            ? 'Items are no longer available'
            : 'আইটেমগুলো আর পাওয়া যাচ্ছে না'
        )
      }
    } catch {
      toast.error(t('error'))
    } finally {
      setReordering(null)
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId))
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 bg-background"
      >
        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center nb-card bg-[#FFD700]/10 p-4">
          <Package className="h-9 w-9 text-[#FFD700]" />
        </div>
        <h2 className="text-xl font-heading font-black text-foreground mb-2">
          {t('loginFirst')}
        </h2>
        <button
          onClick={() => navigate('login')}
          className="nb-btn px-6 py-3 bg-[#FFD700] text-[#0A0A0A] text-sm"
        >
          {t('login')}
        </button>
      </motion.div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-10 bg-background border-b-[3px] border-foreground px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('profile')}
            className="p-1.5 transition-colors text-[#FFD700]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-heading font-black text-foreground">
            {t('myOrders')}
          </h1>
          <span className="ml-auto text-xs font-bold text-muted-foreground">
            {orders.length} {t('orders')}
          </span>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          // Loading skeletons
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse nb-card-static bg-card p-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="h-5 bg-input rounded w-24" />
                  <div className="h-6 bg-input rounded w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-input rounded w-20" />
                  <div className="h-4 bg-input rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center border-[3px] border-foreground bg-[#FFD700]/10 shadow-[4px_4px_0px_var(--foreground)] mb-6">
              <ShoppingBag className="h-10 w-10 text-[#FFD700]" />
            </div>
            <h2 className="text-xl font-heading font-black text-foreground mb-2">
              {t('noOrders')}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
              {language === 'en'
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : 'আপনি এখনো কোনো অর্ডার করেননি। আপনার অর্ডার এখানে দেখতে কেনাকাটা শুরু করুন!'}
            </p>
            <button
              onClick={() => navigate('home')}
              className="nb-btn px-6 py-3 bg-[#FFD700] text-[#0A0A0A] text-sm font-black uppercase"
            >
              {t('browseProducts')}
            </button>
          </motion.div>
        ) : (
          // Orders list
          <div className="space-y-4">
            {orders.map((order, index) => {
              const isExpanded = expandedOrderId === order.id
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const itemCount = order.orderItems.reduce((sum, i) => sum + i.quantity, 0)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="nb-card-static bg-card overflow-hidden"
                >
                  {/* Order Header */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-mono font-black text-foreground">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="nb-chip"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}
                        >
                          {statusLabel(order.status)}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {itemCount} {itemCount === 1 ? t('item') : t('items')}
                      </span>
                      <span className="text-base font-black text-[#FFD700]">
                        ৳{Number(order.total).toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Order Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t-[2px] border-foreground/20 pt-4 space-y-4">
                          {/* Order Items */}
                          <div className="space-y-3">
                            {order.orderItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3"
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-foreground bg-muted">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-semibold">
                                    x{item.quantity} • ৳{Number(item.price).toLocaleString()} {language === 'en' ? 'each' : 'প্রতিটি'}
                                  </p>
                                </div>
                                <span className="text-sm font-black text-[#FFD700] shrink-0">
                                  ৳{(Number(item.price) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order Info */}
                          <div className="rounded-xl border-[2px] border-foreground/20 p-3 space-y-2 text-xs">
                            {order.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                                <span className="text-muted-foreground font-semibold">{order.address}</span>
                              </div>
                            )}
                            {order.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-semibold">{order.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-semibold">
                                {t('paymentMethod')}: {paymentLabel(order.paymentMethod)}
                              </span>
                            </div>
                            {order.transactionId && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-semibold">
                                  {t('transactionId')}: <span className="font-mono">{order.transactionId}</span>
                                </span>
                              </div>
                            )}
                            {order.note && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground font-semibold">
                                  {language === 'en' ? 'Note' : 'নোট'}: {order.note}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Reorder Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReorder(order)
                            }}
                            disabled={reordering === order.id}
                            className="nb-btn-sm w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 disabled:opacity-50"
                          >
                            {reordering === order.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {language === 'en' ? 'Adding to cart...' : 'কার্টে যোগ হচ্ছে...'}
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                {language === 'en' ? 'Reorder' : 'আবার অর্ডার করুন'}
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
