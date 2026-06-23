import { create } from 'zustand'

type NavView =
  | 'home'
  | 'categories'
  | 'cart'
  | 'profile'
  | 'search'
  | 'product-detail'
  | 'login'
  | 'register'
  | 'orders'
  | 'checkout'
  | 'chat'
  | 'privacy'
  | 'terms'
  | 'about'

interface NavStore {
  currentView: NavView
  previousView: NavView | null
  selectedProductId: string | null
  selectedCategory: string | null
  searchQuery: string | null
  chatSenderId: string | null
  navigate: (
    view: NavView,
    data?: { productId?: string; category?: string; query?: string; senderId?: string }
  ) => void
  goBack: () => void
  reset: () => void
}

export const useNavStore = create<NavStore>()((set, get) => ({
  currentView: 'home',
  previousView: null,
  selectedProductId: null,
  selectedCategory: null,
  searchQuery: null,
  chatSenderId: null,

  navigate: (view, data) => {
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
      selectedProductId: data?.productId ?? state.selectedProductId,
      selectedCategory: data?.category ?? state.selectedCategory,
      searchQuery: data?.query ?? state.searchQuery,
      chatSenderId: data?.senderId ?? (view === 'chat' ? state.chatSenderId : state.chatSenderId),
    }))
  },

  goBack: () => {
    const { previousView } = get()
    if (previousView) {
      set((state) => ({
        currentView: previousView,
        previousView: state.currentView,
      }))
    }
  },

  reset: () => {
    set({
      currentView: 'home',
      previousView: null,
      selectedProductId: null,
      selectedCategory: null,
      searchQuery: null,
      chatSenderId: null,
    })
  },
}))

export type { NavView }
