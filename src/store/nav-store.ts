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

// Whitelist of valid views to prevent injection
const VALID_VIEWS: NavView[] = ['home', 'categories', 'cart', 'profile', 'search', 'product-detail', 'login', 'register', 'orders', 'checkout', 'chat', 'privacy', 'terms', 'about']

// Sanitize string input: only allow safe characters, reject anything that could be XSS/LFI
function sanitizeParam(value: string | null, maxLength: number = 64): string | null {
  if (!value) return null
  // Reject if contains script-like content or path traversal
  const sanitized = value.slice(0, maxLength).replace(/[<>"'&\\\/]/g, '')
  return sanitized || null
}

// Validate UUID format (productId, senderId, category are UUIDs)
function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

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

// Read initial state from URL on load — with security validation
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
    const rawView = params.get('view')

    // Validate view against whitelist
    const view: NavView | null = rawView && VALID_VIEWS.includes(rawView as NavView) ? (rawView as NavView) : null

    if (view) {
      // Validate UUID params — reject non-UUID values
      const rawProductId = sanitizeParam(params.get('productId'))
      const rawSenderId = sanitizeParam(params.get('senderId'))
      const rawCategory = sanitizeParam(params.get('category'))
      const rawQuery = sanitizeParam(params.get('query'))

      return {
        currentView: view,
        previousView: null as NavView | null,
        selectedProductId: rawProductId && isValidUUID(rawProductId) ? rawProductId : null,
        selectedCategory: rawCategory && isValidUUID(rawCategory) ? rawCategory : null,
        searchQuery: rawQuery, // searchQuery is safe — only used for display, not DB queries
        chatSenderId: rawSenderId && (rawSenderId === 'admin' || isValidUUID(rawSenderId)) ? rawSenderId : null,
      }
    }
  } catch {
    // Ignore parse errors
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

// Update URL to reflect current state — with sanitized values
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
  if (state.selectedProductId && isValidUUID(state.selectedProductId)) {
    params.set('productId', state.selectedProductId)
  }
  if (state.selectedCategory && isValidUUID(state.selectedCategory)) {
    params.set('category', state.selectedCategory)
  }
  if (state.searchQuery) {
    // searchQuery is user input for search — safe to include, but sanitize
    params.set('query', state.searchQuery.slice(0, 64))
  }
  if (state.chatSenderId && (state.chatSenderId === 'admin' || isValidUUID(state.chatSenderId))) {
    params.set('senderId', state.chatSenderId)
  }

  const search = params.toString()
  const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname

  // Use replaceState to avoid polluting browser history
  window.history.replaceState({}, '', newUrl)
}

export const useNavStore = create<NavStore>()((set, get) => {
  // Initialize from URL on client-side
  const initialState = typeof window !== 'undefined' ? getInitialStateFromURL() : {
    currentView: 'home' as NavView,
    previousView: null as NavView | null,
    selectedProductId: null as string | null,
    selectedCategory: null as string | null,
    searchQuery: null as string | null,
    chatSenderId: null as string | null,
  }

  return {
    ...initialState,

  navigate: (view, data) => {
    // Validate view
    if (!VALID_VIEWS.includes(view)) return

    // Validate UUID data params
    const productId = data?.productId && isValidUUID(data.productId) ? data.productId : undefined
    const category = data?.category && isValidUUID(data.category) ? data.category : undefined
    const senderId = data?.senderId && (data.senderId === 'admin' || isValidUUID(data.senderId)) ? data.senderId : undefined

    set((state) => {
      const newState = {
        previousView: state.currentView,
        currentView: view,
        selectedProductId: productId ?? state.selectedProductId,
        selectedCategory: category ?? state.selectedCategory,
        searchQuery: data?.query?.slice(0, 64) ?? state.searchQuery,
        chatSenderId: senderId ?? (view === 'chat' ? state.chatSenderId : state.chatSenderId),
      }

      // Update URL after state change
      setTimeout(() => updateURL(newState), 0)

      return newState
    })
  },

  goBack: () => {
    const { previousView } = get()
    if (previousView && VALID_VIEWS.includes(previousView)) {
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
  }
})

export type { NavView }
