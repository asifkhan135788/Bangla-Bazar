'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavStore } from '@/store/nav-store'

export default function PromoBanner() {
  const navigate = useNavStore((s) => s.navigate)

  return (
    <section className="w-full overflow-hidden">
      <div className="relative bg-[#FFD700] border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)]">
        {/* Top Border Line */}
        <div className="border-t-[3px] border-foreground" />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:py-10 text-center">
          {/* Sparkle Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <Sparkles className="h-8 w-8 text-[#FF6B9D] mb-2" />
          </motion.div>

          {/* English Text */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl sm:text-2xl md:text-3xl font-black text-foreground"
          >
            Special Offer!{' '}
            <span className="text-[#FF6B9D]">Traditional Wear Collection</span>
          </motion.h2>

          {/* Bengali Text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-sm sm:text-base text-foreground/70 font-bold"
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
              <span className="text-foreground/40 text-xs sm:text-sm tracking-widest uppercase font-bold">
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
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('categories')}
            className="nb-btn mt-5 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FFD700] px-6 py-2.5 text-sm"
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Bottom Border Line */}
        <div className="border-b-[3px] border-foreground" />
      </div>
    </section>
  )
}
