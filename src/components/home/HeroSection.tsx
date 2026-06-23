'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'

const TYPING_SPEED = 100 // ms per character for title
const SUBTITLE_SPEED = 30 // ms per character for subtitle
const PAUSE_BEFORE_SUBTITLE = 400 // ms pause after title finishes

export default function HeroSection() {
  const navigate = useNavStore((s) => s.navigate)
  const { t } = useLangStore()
  const heroTitle = t('heroTitle')
  const heroSubtitle = t('heroSubtitle')

  const sectionRef = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = useState(0)

  // Typewriter state
  const [titleIndex, setTitleIndex] = useState(0)
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [subtitleStarted, setSubtitleStarted] = useState(false)

  const titleComplete = titleIndex >= heroTitle.length
  const subtitleComplete = subtitleIndex >= heroSubtitle.length

  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 600], [0, 150])
  const contentY = useTransform(scrollY, [0, 600], [0, 50])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  // Reset typewriter when language changes
  useEffect(() => {
    setTitleIndex(0)
    setSubtitleIndex(0)
    setSubtitleStarted(false)
  }, [heroTitle, heroSubtitle])

  // Typewriter effect for title
  useEffect(() => {
    if (titleIndex < heroTitle.length) {
      const timeout = setTimeout(() => {
        setTitleIndex((prev) => prev + 1)
      }, TYPING_SPEED)
      return () => clearTimeout(timeout)
    }
  }, [titleIndex, heroTitle])

  // Start subtitle after title finishes + a short pause
  useEffect(() => {
    if (titleComplete && !subtitleStarted) {
      const timeout = setTimeout(() => {
        setSubtitleStarted(true)
      }, PAUSE_BEFORE_SUBTITLE)
      return () => clearTimeout(timeout)
    }
  }, [titleComplete, subtitleStarted])

  // Typewriter effect for subtitle
  useEffect(() => {
    if (subtitleStarted && subtitleIndex < heroSubtitle.length) {
      const timeout = setTimeout(() => {
        setSubtitleIndex((prev) => prev + 1)
      }, SUBTITLE_SPEED)
      return () => clearTimeout(timeout)
    }
  }, [subtitleStarted, subtitleIndex, heroSubtitle])

  // Fallback parallax via scroll event for smoother control
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        if (rect.bottom > 0) {
          setOffsetY(window.scrollY * 0.4)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayedTitle = heroTitle.slice(0, titleIndex)
  const displayedSubtitle = heroSubtitle.slice(0, subtitleIndex)

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden"
    >
      {/* Background - dark gradient fallback + image with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-[120%]"
        style={{ y: bgY }}
      >
        {/* Dark gradient fallback (always present beneath the image) */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a0e] via-[#0d0d08] to-[#1a1a0e]" />
        {/* Background image layer */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/banners/hero-banner.svg')",
            transform: `translateY(${offsetY * 0.1}px)`,
          }}
        />
      </motion.div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />

      {/* Yellow accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#FFD700]" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
      >
        {/* Title with typewriter */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#FFD700] tracking-tight inline-flex items-center justify-center"
        >
          <span>{displayedTitle}</span>
          <span
            className={`inline-block w-[3px] sm:w-[4px] md:w-[5px] h-[0.75em] bg-[#FFD700] ml-1 align-middle ${
              titleComplete && !subtitleStarted ? 'animate-blink' : (!titleComplete ? '' : 'animate-blink')
            }`}
          />
        </motion.h1>

        {/* Subtitle with typewriter */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-foreground/90 max-w-lg min-h-[1.75em]"
        >
          <span>{displayedSubtitle}</span>
          {subtitleStarted && !subtitleComplete && (
            <span className="inline-block w-[2px] h-[1em] bg-foreground/70 ml-0.5 align-middle animate-blink" />
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
        >
          {/* Shop Now Button - Yellow bg, black text */}
          <button
            onClick={() => navigate('categories')}
            className="w-48 sm:w-auto rounded-xl bg-[#FFD700] px-8 py-3 text-base font-semibold text-[#0A0A0A] shadow-lg transition-all hover:bg-[#FFE44D] hover:shadow-xl active:bg-[#E6C200] active:scale-95"
          >
            {t('shopNow')}
          </button>

          {/* View Collection Button - Outline yellow */}
          <button
            onClick={() => navigate('categories')}
            className="w-48 sm:w-auto rounded-xl border-2 border-[#FFD700] px-8 py-3 text-base font-semibold text-[#FFD700] backdrop-blur-sm transition-all hover:bg-[#FFD700]/10 hover:border-[#FFD700] active:scale-95"
          >
            {t('viewCollection')}
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span className="text-xs text-foreground/50 tracking-wider uppercase">{t('scroll')}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ChevronDown className="h-5 w-5 text-[#FFD700]" />
        </motion.div>
      </motion.div>

      {/* Keyframes for blinking cursor */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </section>
  )
}
