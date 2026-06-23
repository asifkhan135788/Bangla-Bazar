'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'

export default function PromoBanner() {
  const navigate = useNavStore((s) => s.navigate)

  return (
    <section className="w-full overflow-hidden">
      <div className="relative bg-gradient-to-r from-background via-card to-background">
        {/* Yellow Accent Line at Top */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

        {/* Decorative Glow */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#FFD700]/5 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#FFD700]/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:py-10 text-center">
          {/* Sparkle Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <Sparkles className="h-6 w-6 text-[#FFD700] mb-2" />
          </motion.div>

          {/* English Text */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground"
          >
            Special Offer!{' '}
            <span className="text-[#FFD700]">Traditional Wear Collection</span>
          </motion.h2>

          {/* Bengali Text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-sm sm:text-base text-foreground/70"
          >
            বিশেষ অফার! ঐতিহ্যবাহী পোশাক সংগ্রহ
          </motion.p>

          {/* Scrolling Text Marquee */}
          <div className="mt-4 w-full overflow-hidden">
            <motion.div
              animate={{ x: ['100%', '-100%'] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="whitespace-nowrap"
            >
              <span className="text-foreground/40 text-xs sm:text-sm tracking-widest uppercase">
                Limited Time Offer - সীমিত সময়ের অফার - Free Delivery on Orders Over ৳999 - ৳৯৯৯ এর বেশি অর্ডারে ফ্রি ডেলিভারি - Limited Time Offer - সীমিত সময়ের অফার - Free Delivery on Orders Over ৳999 - ৳৯৯৯ এর বেশি অর্ডারে ফ্রি ডেলিভারি
              </span>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('categories')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FFD700] px-6 py-2.5 text-sm font-semibold text-[#0A0A0A] shadow-lg transition-colors hover:bg-[#FFE44D]"
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Bottom Yellow Accent Line */}
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
      </div>
    </section>
  )
}
