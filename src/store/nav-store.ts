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

// Read initial state from URL on load
function getInitialStateFromURL() {
  if (typeof window === 'undefined') {
    return {
      currentView: 'home' as NavView,
      previousView: null as NavView | null,
      selectedProductId: null as string | null,
      selectedCategory: null as string | null,
      searchQuery: null as string | null,
      chatSenderId: null as string | null,
    }
  }

  try {
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as NavView | null
    const validViews: NavView[] = ['home', 'categories', 'cart', 'profile', 'search', 'product-detail', 'login', 'register', 'orders', 'checkout', 'chat', 'privacy', 'terms', 'about']

    if (view && validViews.includes(view)) {
      return {
        currentView: view,
        previousView: null as NavView | null,
        selectedProductId: params.get('productId') || null,
        selectedCategory: params.get('category') || null,
        searchQuery: params.get('query') || null,
        chatSenderId: params.get('senderId') || null,
      }
    }
  } catch {
    // Ignore
  }

  return {
    currentView: 'home' as NavView,
    previousView: null as NavView | null,
    selectedProductId: null as string | null,
    selectedCategory: null as string | null,
    searchQuery: null as string | null,
    chatSenderId: null as string | null,
  }
}

// Update URL to reflect current state
function updateURL(state: {
  currentView: NavView
  selectedProductId: string | null
  selectedCategory: string | null
  searchQuery: string | null
  chatSenderId: string | null
}) {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams()

  if (state.currentView !== 'home') {
    params.set('view', state.currentView)
  }
  if (state.selectedProductId) params.set('productId', state.selectedProductId)
  if (state.selectedCategory) params.set('category', state.selectedCategory)
  if (state.searchQuery) params.set('query', state.searchQuery)
  if (state.chatSenderId) params.set('senderId', state.chatSenderId)

  const search = params.toString()
  const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname

  // Use replaceState to avoid polluting browser history
  window.history.replaceState({}, '', newUrl)
}

export const useNavStore = create<NavStore>()((set, get) => ({
  currentView: 'home',
  previousView: null,
  selectedProductId: null,
  selectedCategory: null,
  searchQuery: null,
  chatSenderId: null,

  navigate: (view, data) => {
    set((state) => {
      const newState = {
        previousView: state.currentView,
        currentView: view,
        selectedProductId: data?.productId ?? state.selectedProductId,
        selectedCategory: data?.category ?? state.selectedCategory,
        searchQuery: data?.query ?? state.searchQuery,
        chatSenderId: data?.senderId ?? (view === 'chat' ? state.chatSenderId : state.chatSenderId),
      }

      // Update URL after state change
      setTimeout(() => updateURL(newState), 0)

      return newState
    })
  },

  goBack: () => {
    const { previousView } = get()
    if (previousView) {
      set((state) => {
        const newState = {
          currentView: previousView,
          previousView: state.currentView,
        }
        setTimeout(() => updateURL({ ...state, ...newState }), 0)
        return newState
      })
    }
  },

  reset: () => {
    const newState = {
      currentView: 'home' as NavView,
      previousView: null as NavView | null,
      selectedProductId: null as string | null,
      selectedCategory: null as string | null,
      searchQuery: null as string | null,
      chatSenderId: null as string | null,
    }
    setTimeout(() => updateURL(newState), 0)
    set(newState)
  },
}))

export type { NavView }
