'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useNavStore } from '@/store/nav-store'
import { useCartStore } from '@/store/cart-store'
import { useLangStore } from '@/store/lang-store'
import { useAuthStore } from '@/store/auth-store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { navigate } = useNavStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { language, setLanguage, t } = useLangStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = mounted ? resolvedTheme === 'dark' : true

  const displayItemCount = mounted ? itemCount : 0

  // Menu items
  const menuItems = [
    {
      label: t('myOrders'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      action: () => {
        if (isAuthenticated) {
          navigate('orders')
        } else {
          navigate('login')
        }
      },
    },
    {
      label: t('chatWithSeller'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      action: () => {
        if (isAuthenticated) {
          navigate('chat')
        } else {
          navigate('login')
        }
      },
    },
    {
      label: t('about'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      action: () => navigate('about'),
    },
    {
      label: t('privacyPolicy'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      action: () => navigate('privacy'),
    },
    {
      label: t('termsConditions'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      action: () => navigate('terms'),
    },
    {
      label: t('contactSupport'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      action: () => {
        if (isAuthenticated && user) {
          navigate('chat', { senderId: 'admin' })
        } else {
          navigate('login')
        }
      },
    },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-border transition-shadow duration-200 ${
          scrolled ? 'shadow-lg' : 'shadow-none'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center h-14 px-4 max-w-7xl mx-auto">
          {/* Left: Hamburger Menu Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg transition-colors text-foreground hover:bg-card shrink-0"
            aria-label="Open menu"
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
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Center: Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 mx-auto"
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

      {/* Side Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-[280px] flex flex-col"
              style={{
                backgroundColor: isDark ? '#111' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#0A0A0A',
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              {/* Drawer Header with Close Button */}
              <div
                className="flex items-center justify-between px-5 h-14 border-b"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <span className="text-lg font-bold" style={{ color: '#FFD700' }}>
                  {t('menu')}
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  aria-label="Close menu"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              {mounted && isAuthenticated && user && (
                <div
                  className="px-5 py-3 border-b"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}
                    >
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {user.name || user.email}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto py-2">
                {/* Language Toggle */}
                <div
                  className="px-5 py-4 border-b"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <p
                    className="text-xs uppercase tracking-wider mb-3"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {t('language')}
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        language === 'en'
                          ? isDark ? 'text-white' : 'text-black'
                          : isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    >
                      EN
                    </span>
                    {/* Language Switch */}
                    <button
                      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                      className="relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none"
                      style={{
                        backgroundColor:
                          language === 'bn' ? '#FFD700' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                      }}
                      aria-label={`Switch language to ${language === 'en' ? 'Bengali' : 'English'}`}
                    >
                      <span
                        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200"
                        style={{
                          left: language === 'bn' ? 'calc(100% - 26px)' : '2px',
                        }}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium ${
                        language === 'bn'
                          ? isDark ? 'text-white' : 'text-black'
                          : isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    >
                      বাং
                    </span>
                  </div>
                </div>

                {/* Theme Toggle */}
                <div
                  className="px-5 py-4 border-b"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <p
                    className="text-xs uppercase tracking-wider mb-3"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {t('appearance')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mounted && isDark ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      )}
                      <span
                        className="text-sm"
                        style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
                      >
                        {mounted && isDark
                          ? t('darkMode')
                          : t('lightMode')}
                      </span>
                    </div>
                    {/* Theme Switch */}
                    {mounted && (
                      <button
                        onClick={toggleTheme}
                        className="relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none"
                        style={{
                          backgroundColor: isDark
                            ? '#FFD700'
                            : 'rgba(0,0,0,0.15)',
                        }}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                      >
                        <span
                          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200"
                          style={{
                            left: isDark ? 'calc(100% - 26px)' : '2px',
                          }}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="py-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action()
                        setDrawerOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5"
                      style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div
                className="px-5 py-4 border-t"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <p
                  className="text-[10px] text-center"
                  style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
                >
                  © 2024 Bangla Bazar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
