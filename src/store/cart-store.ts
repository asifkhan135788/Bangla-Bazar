import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  nameBN?: string
  price: number
  salePrice?: number
  image?: string
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getTotal: () => number
  getItemCount: () => number
  setOpen: (open: boolean) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId
          )

          if (existingIndex > -1) {
            const existing = state.items[existingIndex]
            const newQuantity = Math.min(
              existing.quantity + (item.quantity || 1),
              item.stock
            )
            const updated = [...state.items]
            updated[existingIndex] = { ...existing, quantity: newQuantity }
            return { items: updated }
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: item.quantity || 1 },
            ],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      isInCart: (productId) => {
        return get().items.some((i) => i.productId === productId)
      },

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.salePrice || item.price) * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      setOpen: (open) => {
        set({ isOpen: open })
      },
    }),
    {
      name: 'bdk-cart',
    }
  )
)
