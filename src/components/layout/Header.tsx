'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useNavStore } from '@/store/nav-store'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useTheme } from 'next-themes'

export default function Header() {
  const { navigate } = useNavStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { isAuthenticated } = useAuthStore()
  const { resolvedTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayItemCount = mounted ? itemCount : 0

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#FFD700] transition-shadow duration-200 ${
        scrolled ? 'shadow-[4px_4px_0px_#1A1A1A]' : 'shadow-none'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2"
          aria-label="Go to home"
        >
          <span
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-black border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] bg-[#FF6B9D] text-white"
          >
            BB
          </span>
          <span className="text-xl font-heading font-black tracking-tight text-[#1A1A1A]">
            <span className="text-[#1A1A1A]">Bangla</span>
            <span className="text-[#FF6B9D]"> Bazar</span>
          </span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <button
            onClick={() => navigate('search')}
            className="w-10 h-10 rounded-xl border-2 border-[#1A1A1A] bg-white flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] hover:translate-[-1px,-1px] transition-all active:shadow-[0px_0px_0px_#1A1A1A] active:translate-[2px,2px]"
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Cart */}
          <button
            onClick={() => navigate('cart')}
            className="relative w-10 h-10 rounded-xl border-2 border-[#1A1A1A] bg-white flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] hover:translate-[-1px,-1px] transition-all active:shadow-[0px_0px_0px_#1A1A1A] active:translate-[2px,2px]"
            aria-label={`Cart with ${displayItemCount} items`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {mounted && displayItemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-black bg-[#FF6B9D] text-white border-2 border-[#1A1A1A] px-1">
                {displayItemCount > 99 ? '99+' : displayItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
