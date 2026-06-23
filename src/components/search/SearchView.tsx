'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import type { LangKey } from '@/store/lang-store'
import { ProductCard } from '@/components/products/ProductCard'
import { toNumber, safeJsonParse } from '@/lib/utils'

interface ProductApi {
  id: string
  name: string
  nameBN?: string
  price: unknown
  salePrice?: unknown
  images?: unknown
  stock: number
  rating: unknown
  buyCount?: unknown
  unit?: string
  category?: string
  categoryRef?: { id: string; name: string; nameBN?: string; slug: string }
}

interface Product {
  id: string
  name: string
  nameBN?: string
  price: number
  salePrice?: number | null
  image: string | null
  stock: number
  rating: number
  buyCount: number
  unit?: string
  category?: string
}

interface Category {
  id: string
  name: string
  nameBN?: string
  slug: string
  _count?: { products: number }
}

const SORT_OPTIONS: { value: string; labelKey: LangKey }[] = [
  { value: 'newest', labelKey: 'newest' },
  { value: 'price_asc', labelKey: 'priceLowHigh' },
  { value: 'price_desc', labelKey: 'priceHighLow' },
  { value: 'name', labelKey: 'name' },
  { value: 'rating', labelKey: 'rating' },
]

const RECENT_SEARCHES_KEY = 'bdk-recent-searches'
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return
  if (!query.trim()) return
  try {
    const existing = getRecentSearches()
    const filtered = existing.filter(
      (s) => s.toLowerCase() !== query.trim().toLowerCase()
    )
    const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // Silently fail
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // Silently fail
  }
}

function normalizeProduct(raw: ProductApi): Product {
  const images = safeJsonParse<string[]>(raw.images, [])
  return {
    id: raw.id,
    name: raw.name,
    nameBN: raw.nameBN,
    price: toNumber(raw.price),
    salePrice: raw.salePrice != null ? toNumber(raw.salePrice) : null,
    image: images.length > 0 ? images[0] : null,
    stock: raw.stock ?? 0,
    rating: toNumber(raw.rating),
    buyCount: toNumber(raw.buyCount),
    unit: raw.unit,
    category: raw.category,
  }
}

export function SearchView() {
  const { searchQuery, navigate } = useNavStore()
  const { t } = useLangStore()
  const [query, setQuery] = useState(searchQuery || '')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch {
        // Silently fail
      }
    }
    fetchCategories()
  }, [])

  // Keep latest values in refs to avoid stale closures
  const queryRef = useRef(query)
  const categoryRef = useRef(category)
  const minPriceRef = useRef(minPrice)
  const maxPriceRef = useRef(maxPrice)
  const sortByRef = useRef(sortBy)

  useEffect(() => { queryRef.current = query }, [query])
  useEffect(() => { categoryRef.current = category }, [category])
  useEffect(() => { minPriceRef.current = minPrice }, [minPrice])
  useEffect(() => { maxPriceRef.current = maxPrice }, [maxPrice])
  useEffect(() => { sortByRef.current = sortBy }, [sortBy])

  // Core search function (uses refs, so it's always stable)
  const doSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (categoryRef.current) params.set('category', categoryRef.current)
      if (minPriceRef.current) params.set('minPrice', minPriceRef.current)
      if (maxPriceRef.current) params.set('maxPrice', maxPriceRef.current)
      params.set('sortBy', sortByRef.current)
      params.set('limit', '20')

      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const rawProducts = data.products || []
        setProducts(rawProducts.map(normalizeProduct))
        setTotal(data.total || 0)
      }

      // Save to recent searches when a meaningful search is performed
      if (q.trim()) {
        saveRecentSearch(q.trim())
        setRecentSearches(getRecentSearches())
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  // Debounce query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      doSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, doSearch])

  // Immediate search when filters change
  useEffect(() => {
    doSearch(queryRef.current)
  }, [category, sortBy, minPrice, maxPrice, doSearch])

  const handleClearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const handleApplyPriceFilter = () => {
    doSearch(query)
  }

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
  }

  const handleClearRecentSearches = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-10 bg-background border-b-[3px] border-foreground shadow-[0_3px_0_0_var(--foreground)] px-4 py-3"
      >
        <div className="max-w-7xl mx-auto">
          {/* Search input */}
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 text-muted-foreground"
              width="20"
              height="20"
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
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchProducts')}
              className="nb-input w-full pl-10 pr-10 py-3 text-sm bg-card"
              aria-label="Search products"
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-3 p-1 rounded-full hover:bg-input transition-colors text-muted-foreground"
                aria-label="Clear search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 flex-wrap"
            >
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {t('recent')}
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentSearchClick(term)}
                  className="nb-chip bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700] cursor-pointer hover:bg-[#FFD700]/25 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  {term}
                </button>
              ))}
              <button
                onClick={handleClearRecentSearches}
                className="text-xs text-[#FF6B9D] font-bold hover:underline ml-1"
                aria-label="Clear recent searches"
              >
                {t('clear')}
              </button>
            </motion.div>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#FF6B9D]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {showFilters ? t('hideFilters') : t('showFilters')}
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-card border-b-[3px] border-foreground"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3">
              {/* Category dropdown */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="nb-input px-3 py-2 text-sm bg-background"
                aria-label="Filter by category"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                    {cat.nameBN ? ` (${cat.nameBN})` : ''}
                  </option>
                ))}
              </select>

              {/* Price range */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={`${t('min')} ৳`}
                  className="nb-input w-24 px-3 py-2 text-sm bg-background"
                  aria-label="Minimum price"
                />
                <span className="text-muted-foreground text-sm font-bold">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={`${t('max_price')} ৳`}
                  className="nb-input w-24 px-3 py-2 text-sm bg-background"
                  aria-label="Maximum price"
                />
                <button
                  onClick={handleApplyPriceFilter}
                  className="nb-btn-sm bg-[#FFD700] text-[#0A0A0A] px-3 py-2 text-sm"
                >
                  {t('go')}
                </button>
              </div>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="nb-input px-3 py-2 text-sm bg-background"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Result count */}
        {searched && !loading && (
          <p className="text-sm text-muted-foreground mb-4 font-bold">
            {total > 0
              ? `${total} ${t('productsFound')}`
              : t('noProductsFound')}
          </p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
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
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                nameBN={product.nameBN}
                price={product.price}
                salePrice={product.salePrice}
                image={product.image}
                stock={product.stock}
                rating={product.rating}
                buyCount={product.buyCount}
                unit={product.unit}
                category={product.category}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && searched && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-card border-[3px] border-foreground shadow-[4px_4px_0px_var(--foreground)]">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t('noProductsFound')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
              {t('adjustSearch')}
            </p>
            <button
              onClick={() => navigate('home')}
              className="nb-btn bg-[#FFD700] text-[#0A0A0A] px-6 py-2.5 text-sm"
            >
              {t('browseProducts')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
