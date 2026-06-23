'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'

export function BannedScreen() {
  const { user } = useAuthStore()
  const navigate = useNavStore((s) => s.navigate)
  const { language, t } = useLangStore()

  const isBanned = user?.role === 'banned' || user?.banned === true

  // Calculate time remaining if bannedUntil is available
  const bannedUntil = (user as Record<string, unknown>)?.bannedUntil as string | undefined
  let banMessage = ''
  if (isBanned && bannedUntil) {
    const expiry = new Date(bannedUntil)
    const now = new Date()
    const diffMs = expiry.getTime() - now.getTime()
    if (diffMs > 0) {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      if (diffDays > 0) {
        banMessage = language === 'en'
          ? `${t('banWillLift')} ${diffDays} ${diffDays > 1 ? t('days') : t('day')} and ${diffHours} ${diffHours !== 1 ? t('hours') : t('hour')}`
          : `আপনার নিষেধাজ্ঞা ${diffDays} ${diffDays > 1 ? t('days') : t('day')} এবং ${diffHours} ${diffHours !== 1 ? t('hours') : t('hour')}য় শেষ হবে`
      } else {
        banMessage = language === 'en'
          ? `${t('banWillLift')} ${diffHours} ${diffHours !== 1 ? t('hours') : t('hour')}`
          : `আপনার নিষেধাজ্ঞা ${diffHours} ${diffHours !== 1 ? t('hours') : t('hour')}য় শেষ হবে`
      }
    }
  }

  return (
    <AnimatePresence>
      {isBanned && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-md mx-4 text-center"
          >
            {/* Red warning icon with pulse */}
            <motion.div
              className="w-24 h-24 rounded-xl mx-auto mb-6 flex items-center justify-center bg-[#EF4444]/10 border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)]"
              animate={{
                rotate: [0, -2, 2, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ShieldAlert className="h-12 w-12 text-[#EF4444]" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-black text-[#EF4444] mb-3 uppercase tracking-tight"
            >
              {t('accountBanned')}
            </motion.h1>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="nb-card-static bg-card p-6 mb-4"
            >
              <p className="text-sm text-foreground leading-relaxed">
                {t('bannedMessage')}
              </p>
              {banMessage && (
                <p className="text-sm text-muted-foreground mt-2">
                  {banMessage}
                </p>
              )}
            </motion.div>

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                {t('contactSupport')}:
              </p>

              {/* Chat with CS button */}
              <button
                onClick={() => navigate('chat', { senderId: 'admin' })}
                className="nb-btn-sm inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] text-[#0A0A0A] font-bold text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                {t('chatWithSupport')}
              </button>

              <div className="pt-1">
                <a
                  href="mailto:support@banglabazar.com.bd"
                  className="inline-block text-sm font-bold text-[#FF6B9D]"
                >
                  support@banglabazar.com.bd
                </a>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  +880 1XXX-XXXXXX
                </span>
              </div>
            </motion.div>

            {/* Yellow accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 nb-accent-bar w-16 mx-auto origin-center"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
