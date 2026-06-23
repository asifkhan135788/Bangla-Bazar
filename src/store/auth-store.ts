import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  role: string
  avatar?: string
  banned?: boolean
  bannedUntil?: string | null
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        })
      },

      updateUser: (data) => {
        set((state) => {
          if (!state.user) return state
          return {
            user: { ...state.user, ...data },
          }
        })
      },
    }),
    {
      name: 'bdk-auth',
    }
  )
)
