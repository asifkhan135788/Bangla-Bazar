'use client'

import { motion } from 'framer-motion'

// BanglaBazar branded loading spinner - matches the site's gold + dark theme
export function BanglaBazarLoader({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeMap = {
    sm: { outer: 32, inner: 24, text: 'text-xs' },
    md: { outer: 48, inner: 36, text: 'text-sm' },
    lg: { outer: 72, inner: 54, text: 'text-base' },
  }

  const s = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        {/* Outer ring - gold */}
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#FFD700] border-r-[#FFD700]/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner ring - gold lighter */}
        <motion.div
          className="absolute rounded-full border-[2px] border-transparent border-b-[#FFD700]/70"
          style={{ top: 4, left: 4, right: 4, bottom: 4 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full bg-[#FFD700]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: s.outer * 0.15,
            height: s.outer * 0.15,
          }}
        />
      </div>
      {text && (
        <motion.p
          className={`${s.text} text-muted-foreground font-medium`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Product card skeleton that matches the site's card style
export function ProductCardLoader() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Image placeholder */}
      <div className="relative aspect-square bg-[#FFD700]/5 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#FFD700] border-r-[#FFD700]/50 animate-spin" />
      </div>
      {/* Text placeholders */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#FFD700]/5 rounded-md w-3/4 animate-pulse" />
        <div className="h-3 bg-[#FFD700]/5 rounded-md w-1/2 animate-pulse" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 bg-[#FFD700]/10 rounded-md w-16 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-[#FFD700]/10 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Category skeleton that matches the site's category style
export function CategoryCardLoader() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full bg-[#FFD700]/5 flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 rounded-full bg-[#FFD700]/10" />
      </div>
      <div className="h-3 bg-[#FFD700]/5 rounded-md w-12 animate-pulse" />
    </div>
  )
}

// Full page loader
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-background">
      <BanglaBazarLoader size="lg" text={text} />
    </div>
  )
}
