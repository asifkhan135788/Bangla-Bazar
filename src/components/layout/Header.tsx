'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useNavStore } from '@/store/nav-store'
import { useCartStore } from '@/store/cart-store'
import { useLangStore } from '@/store/lang-store'
import { useAuthStore } from '@/store/auth-store'
import { useTheme } from 'next-themes'
import { Search, ShoppingCart } from 'lucide-react'

export default function Header() {
  const { navigate } = useNavStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { t, language, setLanguage } = useLangStore()
  const { resolvedTheme, setTheme } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true
  const displayItemCount = mounted ? itemCount : 0

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background transition-all duration-200 ${
        scrolled
          ? 'border-b-[3px] border-foreground shadow-[0_4px_0_0_var(--foreground)]'
          : 'border-b-2 border-foreground/20'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2.5"
          aria-label="Go to home"
        >
          <img
  src="/images/logo.svg"
  alt="Bangla Bazar"
  className="w-10 h-10 object-contain transition-transform hover:rotate-[-3deg]"
/>
            
          <span className="text-xl font-heading font-black tracking-tight">
            <span className="text-[#22C55E]">Bangla</span>{' '}
            <span className="text-[#FFD700]">Bazar</span>
          </span>
        </button>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="nb-btn-sm px-2.5 py-1 text-xs bg-card text-foreground font-bold"
          >
            {language === 'en' ? 'বাং' : 'EN'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="nb-btn-sm p-2 bg-card text-foreground"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>

          {/* Search */}
          <button
            onClick={() => navigate('search')}
            className="nb-btn-sm p-2 bg-card text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Cart */}
          <button
            onClick={() => navigate('cart')}
            className="relative nb-btn-sm p-2 bg-[#FFD700] text-[#0A0A0A]"
            aria-label={`Cart with ${displayItemCount} items`}
          >
            <ShoppingCart className="h-4 w-4" />
            {mounted && displayItemCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 nb-badge bg-[#22C55E] text-white text-[9px] min-w-[20px] text-center">
                {displayItemCount > 99 ? '99+' : displayItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
