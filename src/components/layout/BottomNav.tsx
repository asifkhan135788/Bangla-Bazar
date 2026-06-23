'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useNavStore } from '@/store/nav-store'
import { useCartStore } from '@/store/cart-store'
import { useLangStore } from '@/store/lang-store'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import type { LangKey } from '@/store/lang-store'

const tabs = [
  {
    id: 'home' as const,
    labelKey: 'home' as LangKey,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'categories' as const,
    labelKey: 'categories' as LangKey,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'cart' as const,
    labelKey: 'cart' as LangKey,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: 'profile' as const,
    labelKey: 'profile' as LangKey,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { currentView, navigate } = useNavStore()
  const { t } = useLangStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Use 0 during SSR to avoid hydration mismatch
  const displayItemCount = mounted ? itemCount : 0

  const isDark = mounted ? resolvedTheme === 'dark' : true

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-3 mb-3">
        <div
          className="flex items-center justify-around rounded-full backdrop-blur-xl shadow-2xl h-16 px-2"
          style={{
            backgroundColor: isDark ? '#111111' : 'rgba(255, 255, 255, 0.85)',
            border: isDark ? '1px solid #2A2A2A' : '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {tabs.map((tab) => {
            const isActive = currentView === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className="relative flex items-center justify-center rounded-full px-3 py-2"
                aria-label={t(tab.labelKey)}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: '#FFD700' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className="relative z-10 flex items-center gap-1.5"
                  style={{
                    color: isActive
                      ? '#0A0A0A'
                      : isDark
                        ? '#888888'
                        : '#555555',
                  }}
                >
                  <span className="relative">
                    {tab.icon}
                    {tab.id === 'cart' && displayItemCount > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold text-white px-1"
                        style={{ backgroundColor: '#f42a41' }}
                      >
                        {displayItemCount > 99 ? '99+' : displayItemCount}
                      </span>
                    )}
                  </span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        className="text-xs font-semibold whitespace-nowrap"
                      >
                        {t(tab.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
