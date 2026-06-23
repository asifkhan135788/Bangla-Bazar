'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cart-store'
import { useNavStore } from '@/store/nav-store'

const DELIVERY_FEE = 60

export function CartView() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } =
    useCartStore()
  const navigate = useNavStore((s) => s.navigate)

  const itemCount = getItemCount()
  const subtotal = getTotal()
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0

  const handleCheckout = () => {
    navigate('checkout')
  }

  // Empty state
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 bg-background"
      >
        {/* Dark theme empty cart illustration */}
        <div className="w-32 h-32 mb-6 flex items-center justify-center rounded-full bg-card border border-border">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFD700"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Looks like you haven&apos;t added anything to your cart yet. Start browsing and find something you love!
        </p>
        <button
          onClick={() => navigate('home')}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors bg-[#FFD700] text-[#0A0A0A] hover:bg-[#FFE44D]"
        >
          Start Shopping
        </button>
      </motion.div>
    )
  }

  return (
    <div className="pb-4 bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-lg font-bold text-foreground">Shopping Cart</h1>
          <span className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </motion.div>

      {/* Cart items */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const effectivePrice = item.salePrice || item.price
            return (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
                className="flex gap-3 bg-card rounded-xl border border-border p-3 mb-3"
              >
                {/* Image */}
                <div
                  className="shrink-0 w-20 h-20 rounded-lg bg-input overflow-hidden cursor-pointer"
                  onClick={() =>
                    navigate('product-detail', { productId: item.productId })
                  }
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#555"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  {item.nameBN && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {item.nameBN}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-[#FFD700]">
                      ৳{effectivePrice.toLocaleString()}
                    </span>
                    {item.salePrice && item.salePrice < item.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ৳{item.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-8 h-8 rounded-l-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-input active:bg-input/80 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b border-border text-sm font-semibold text-foreground bg-card">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded-r-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-input active:bg-input/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>

                    <span className="text-sm font-bold text-[#FFD700]">
                      ৳{(effectivePrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="shrink-0 self-start p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  aria-label="Remove item"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f42a41"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Clear cart */}
        <div className="flex justify-end mb-4">
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Bottom summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.3)] px-4 py-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>৳{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span>৳{DELIVERY_FEE}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span className="text-[#FFD700]">৳{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full mt-3 py-3.5 rounded-xl font-semibold text-base transition-colors active:scale-[0.98] bg-[#FFD700] text-[#0A0A0A] hover:bg-[#FFE44D]"
          >
            Proceed to Checkout
          </button>
        </div>
      </motion.div>
    </div>
  )
}
