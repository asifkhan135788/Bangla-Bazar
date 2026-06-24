'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react'

interface BannerData {
  active: boolean
  title: string
  message: string
  type: 'info' | 'warning' | 'error'
}

const BANNER_STYLES: Record<
  string,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  info: {
    bg: 'rgba(78, 205, 196, 0.1)',
    border: 'border-[3px] border-[#22C55E]',
    text: 'text-[#22C55E]',
    icon: <Info className="h-5 w-5 text-[#22C55E]" />,
  },
  warning: {
    bg: 'rgba(255, 215, 0, 0.1)',
    border: 'border-[3px] border-[#FFD700]',
    text: 'text-[#FFD700]',
    icon: <AlertTriangle className="h-5 w-5 text-[#FFD700]" />,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'border-[3px] border-[#EF4444]',
    text: 'text-[#EF4444]',
    icon: <AlertCircle className="h-5 w-5 text-[#EF4444]" />,
  },
}

export function MaintenanceBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/settings/banner')
        if (res.ok) {
          const data = await res.json()
          if (data.active) {
            setBanner({
              active: data.active,
              title: data.title || 'Notice',
              message: data.message || '',
              type: data.type || 'info',
            })
          }
        }
      } catch {
        // silently fail - banner not available
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [])

  // Don't render if loading, dismissed, or no banner
  if (loading || dismissed || !banner || !banner.active) return null

  const style = BANNER_STYLES[banner.type] || BANNER_STYLES.info

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-16 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md"
      >
        <div
          className={`rounded-xl ${style.border} shadow-[3px_3px_0px_var(--foreground)] overflow-hidden`}
          style={{ backgroundColor: style.bg }}
        >
          {/* NB accent bar at top */}
          <div className="h-1.5 bg-[#FFD700] border-b-[2px] border-foreground" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 mt-0.5">{style.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-black ${style.text} uppercase tracking-wide`}>
                  {banner.title}
                </h3>
                <p className="text-xs text-foreground/80 mt-1 leading-relaxed font-medium">
                  {banner.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setDismissed(true)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-2 border-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
