'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useNavStore } from '@/store/nav-store'
import { useCartStore } from '@/store/cart-store'
import { useLangStore } from '@/store/lang-store'
import { useAuthStore } from '@/store/auth-store'
import { useTheme } from 'next-themes'

export default function Header() {
  const { navigate } = useNavStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { language, setLanguage, t } = useLangStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  // Use useSyncExternalStore to detect client-side rendering without setState in effect
  const mounted = useSyncExternalStore(
    () => () => {}, // subscribe (no-op)
    () => true,     // getSnapshot (client)
    () => false     // getServerSnapshot
  )

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = mounted ? resolvedTheme === 'dark' : true

  const displayItemCount = mounted ? itemCount : 0

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-border transition-shadow duration-200 ${
          scrolled ? 'shadow-lg' : 'shadow-none'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center h-14 px-4 max-w-7xl mx-auto">
          {/* Left: Logo (now at start) */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2"
            aria-label="Go to home"
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}
            >
              BB
            </span>
            <span className="text-lg font-bold text-foreground">
              Bangla Bazar
            </span>
          </button>

          {/* Right: Search icon + Cart icon */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* Search icon */}
            <button
              onClick={() => navigate('search')}
              className="p-2 rounded-lg transition-colors text-foreground hover:bg-card"
              aria-label="Search"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Cart icon with badge */}
            <button
              onClick={() => navigate('cart')}
              className="relative p-2 rounded-lg transition-colors text-foreground hover:bg-card"
              aria-label={`Cart with ${displayItemCount} items`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {mounted && displayItemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1"
                  style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}
                >
                  {displayItemCount > 99 ? '99+' : displayItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

    </>
  )
}
