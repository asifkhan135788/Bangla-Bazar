'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CategoryCardLoader } from '@/components/common/BrandedLoader'
import { useNavStore } from '@/store/nav-store'

interface Category {
  id: string
  name: string
  nameBN?: string
  icon?: string
  slug: string
}

function CategoryCardSkeleton() {
  return <CategoryCardLoader />
}

function CategoryIcon({ icon, name }: { icon?: string; name: string }) {
  // Get first letter of name for the icon
  const initial = name.charAt(0).toUpperCase()

  // If category has a custom icon URL, render it
  if (icon) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD700] text-[#0A0A0A]">
        <img
          src={icon}
          alt={name}
          className="h-8 w-8 object-contain"
          onError={(e) => {
            // Replace with fallback initial on error
            const target = e.currentTarget
            target.style.display = 'none'
            if (target.parentElement) {
              const span = document.createElement('span')
              span.className = 'text-xl font-bold'
              span.textContent = initial
              target.parentElement.appendChild(span)
            }
          }}
        />
      </div>
    )
  }

  // Default: yellow circle with black letter
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD700] text-[#0A0A0A]">
      <span className="text-xl font-bold">{initial}</span>
    </div>
  )
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavStore((s) => s.navigate)

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/categories')
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : data.categories || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleCategoryClick = (category: Category) => {
    navigate('categories', { category: category.slug || category.id })
  }

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Shop by Category
          </h2>
          <div className="mt-2 h-1 w-16 rounded-full bg-[#FFD700]" />
        </motion.div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-[#FFD700] font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                  ease: 'easeOut',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center justify-center rounded-xl bg-card p-6 border border-border hover:border-[#FFD700]/40 hover:shadow-lg hover:shadow-[#FFD700]/5 transition-all cursor-pointer"
              >
                <CategoryIcon icon={category.icon} name={category.name} />
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {category.name}
                </h3>
                {category.nameBN && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{category.nameBN}</p>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">No categories available</p>
          </div>
        )}
      </div>
    </section>
  )
}
