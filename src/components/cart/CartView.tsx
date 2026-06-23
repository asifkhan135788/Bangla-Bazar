'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Minus, Plus, ShoppingBag, CheckSquare, Square } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useNavStore } from '@/store/nav-store'
import { toast } from 'sonner'

const DELIVERY_FEE = 60

export function CartView() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCartStore()
  const navigate = useNavStore((s) => s.navigate)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const itemCount = getItemCount()
  const subtotal = getTotal()
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.productId)))
    }
  }

  const deleteSelected = () => {
    if (selectedIds.size === 0) return
    selectedIds.forEach(id => removeItem(id))
    toast.success(`${selectedIds.size} item(s) removed`)
    setSelectedIds(new Set())
  }

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
        <div className="w-28 h-28 mb-6 flex items-center justify-center nb-card bg-[#FFD700]/10 p-4">
          <ShoppingBag className="h-12 w-12 text-[#FFD700]" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
          Looks like you haven&apos;t added anything yet. Start browsing!
        </p>
        <button
          onClick={() => navigate('home')}
          className="nb-btn px-6 py-3 bg-[#FFD700] text-[#0A0A0A] text-sm"
        >
          Start Shopping
        </button>
      </motion.div>
    )
  }

  const allSelected = selectedIds.size === items.length

  return (
    <div className="pb-4 bg-background min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b-[3px] border-foreground px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-heading font-bold text-foreground">Cart</h1>
            <span className="nb-badge bg-[#FFD700] text-[#0A0A0A]">{itemCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="nb-btn-sm px-3 py-1.5 bg-[#EF4444] text-white text-xs flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete ({selectedIds.size})
              </button>
            )}
            <button
              onClick={clearCart}
              className="text-xs text-[#EF4444] font-bold hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>
      </motion.div>

      {/* Select All */}
      <div className="max-w-7xl mx-auto px-4 mt-3">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
        >
          {allSelected ? (
            <CheckSquare className="h-5 w-5 text-[#FFD700]" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Cart items */}
      <div className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const effectivePrice = item.salePrice || item.price
            const isSelected = selectedIds.has(item.productId)
            return (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
                className={`nb-card bg-card p-3 mb-3 flex gap-3 ${isSelected ? 'ring-2 ring-[#FFD700] ring-offset-2 ring-offset-background' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(item.productId)}
                  className="shrink-0 self-center"
                  aria-label={isSelected ? 'Deselect item' : 'Select item'}
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-[#FFD700]" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Image */}
                <div
                  className="shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 border-foreground"
                  onClick={() => navigate('product-detail', { productId: item.productId })}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                    {item.name}
                  </h3>

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

                  {/* Quantity + Delete row */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-l-lg border-2 border-foreground flex items-center justify-center text-foreground hover:bg-[#FFD700]/10 active:translate-y-[1px] transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t-2 border-b-2 border-foreground text-sm font-bold text-foreground bg-card">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded-r-lg border-2 border-foreground flex items-center justify-center text-foreground hover:bg-[#FFD700]/10 active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#FFD700]">
                        ৳{(effectivePrice * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          removeItem(item.productId)
                          toast.success('Item removed from cart')
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Bottom summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 bg-card border-t-[3px] border-foreground shadow-[0_-4px_0_0_var(--foreground)] px-4 py-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">৳{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span className="font-semibold text-foreground">৳{DELIVERY_FEE}</span>
          </div>
          <div className="border-t-2 border-foreground pt-2 flex justify-between text-lg font-heading font-bold text-foreground">
            <span>Total</span>
            <span className="text-[#FFD700]">৳{total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="nb-btn w-full mt-3 py-3.5 bg-[#FFD700] text-[#0A0A0A] text-base"
          >
            Proceed to Checkout — ৳{total.toLocaleString()}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
