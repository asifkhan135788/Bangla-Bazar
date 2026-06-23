'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavStore } from '@/store/nav-store'
import { ProductCard } from '@/components/products/ProductCard'

interface Category {
  id: string
  name: string
  nameBN?: string
  slug: string
  image?: string | null
  icon?: string | null
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  nameBN?: string
  price: number
  salePrice?: number | null
  images?: string
  stock: number
  rating: number
  unit?: string
  category?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  sharee: '👗',
  punjabi: '👔',
  shoes: '👟',
  clothing: '👕',
  fashion: '✨',
  traditional: '🧵',
}

function getCategoryIcon(category: Category): string {
  if (category.icon) return category.icon
  const slug = category.slug.toLowerCase()
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (slug.includes(key)) return icon
  }
  // Return first letter initial instead of emoji
  return category.name.charAt(0).toUpperCase()
}

function parseImage(images?: string): string | null {
  if (!images) return null
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed[0] || null : null
  } catch {
    return null
  }
}

export function CategoriesView() {
  const { navigate, selectedCategory } = useNavStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(
    selectedCategory
  )
  const [activeCategoryName, setActiveCategoryName] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch {
        // Silently fail
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Fetch products when category is selected
  const handleCategoryClick = async (category: Category) => {
    if (activeCategory === category.id) {
      // Deselect
      setActiveCategory(null)
      setActiveCategoryName('')
      setProducts([])
      return
    }

    setActiveCategory(category.id)
    setActiveCategoryName(category.name)
    setProductsLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('category', category.id)
      params.set('limit', '20')
      params.set('sortBy', 'newest')

      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {
      // Silently fail
    } finally {
      setProductsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 bg-background min-h-screen">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm mb-4"
        aria-label="Breadcrumb"
      >
        <button
          onClick={() => navigate('home')}
          className="text-muted-foreground hover:text-[#FF6B9D] font-bold transition-colors"
        >
          Home
        </button>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="font-bold text-foreground">
          {activeCategoryName || 'All Categories'}
        </span>
      </motion.nav>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading font-black text-xl text-foreground mb-2"
      >
        All Categories
      </motion.h1>
      <div className="nb-accent-bar w-16 mb-4" />

      {/* Categories grid */}
      {categoriesLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-card rounded-xl border-[3px] border-foreground p-4 flex flex-col items-center shadow-[4px_4px_0px_var(--foreground)]"
            >
              <div className="w-14 h-14 rounded-full border-[3px] border-foreground bg-[#FFD700]/10 mb-3" />
              <div className="h-4 bg-[#FFD700]/10 rounded w-2/3 mb-1" />
              <div className="h-3 bg-[#FFD700]/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {categories.map((category, index) => {
            const isActive = activeCategory === category.id
            const productCount = category._count?.products || 0
            const icon = getCategoryIcon(category)

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ rotate: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCategoryClick(category)}
                className={`nb-card bg-card p-4 flex flex-col items-center text-center transition-all ${
                  isActive
                    ? 'shadow-[6px_6px_0px_var(--foreground)] translate-x-[-1px] translate-y-[-1px] border-[#FFD700]'
                    : ''
                }`}
                aria-pressed={isActive}
              >
                {/* Icon/image - yellow circle with NB styling */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3 text-2xl border-[3px] border-foreground shadow-[3px_3px_0px_var(--foreground)]"
                  style={{
                    backgroundColor: isActive
                      ? '#FFD700'
                      : 'hsl(var(--input))',
                    color: isActive ? '#0A0A0A' : '#FFD700',
                  }}
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="font-bold text-lg">{icon}</span>
                  )}
                </div>

                {/* Name */}
                <h3
                  className="text-sm font-bold leading-tight"
                  style={{ color: isActive ? '#FFD700' : 'hsl(var(--foreground))' }}
                >
                  {category.name}
                </h3>
                {category.nameBN && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.nameBN}
                  </p>
                )}

                {/* Product count */}
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  {productCount} product{productCount !== 1 ? 's' : ''}
                </p>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Products grid for selected category */}
      <AnimatePresence mode="wait">
        {activeCategory && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-black text-lg text-foreground">
                {activeCategoryName}
              </h2>
              <button
                onClick={() => {
                  setActiveCategory(null)
                  setActiveCategoryName('')
                  setProducts([])
                }}
                className="nb-btn-sm bg-transparent text-[#FF6B9D] border-[2.5px] border-[#FF6B9D] px-3 py-1.5 text-sm"
              >
                Clear
              </button>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl border-[3px] border-foreground overflow-hidden animate-pulse shadow-[4px_4px_0px_var(--foreground)]"
                  >
                    <div className="aspect-square bg-[#FFD700]/10" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-[#FFD700]/10 rounded w-3/4" />
                      <div className="h-3 bg-[#FFD700]/10 rounded w-1/2" />
                      <div className="h-5 bg-[#FFD700]/10 rounded w-2/3" />
                      <div className="h-9 bg-[#FFD700]/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    nameBN={product.nameBN}
                    price={product.price}
                    salePrice={product.salePrice}
                    image={parseImage(product.images)}
                    stock={product.stock}
                    rating={product.rating}
                    unit={product.unit}
                    category={product.category}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-3"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-sm text-muted-foreground font-bold">
                  No products found in this category
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
