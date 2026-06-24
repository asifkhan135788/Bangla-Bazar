'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardLoader } from '@/components/common/BrandedLoader'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import { toNumber, safeJsonParse } from '@/lib/utils'

interface ProductApi {
  id: string
  name: string
  nameBN?: string
  price: unknown
  salePrice?: unknown
  images: unknown
  rating: unknown
  buyCount?: unknown
  reviewCount?: unknown
  stock: number
  unit?: string
  category: string
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
  unit: string
  category: string
}

interface Category {
  id: string
  name: string
  nameBN?: string
  slug: string
  icon?: string
  productCount: number
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
    unit: raw.unit ?? 'piece',
    category: raw.category ?? '',
  }
}

function CategoryProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 bg-input rounded w-48 animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[160px] max-w-[200px] flex-1">
            <ProductCardLoader />
          </div>
        ))}
      </div>
    </div>
  )
}

function ScrollableProductRow({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative group">
      {/* Left scroll button */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#FFD700] text-[#0A0A0A] flex items-center justify-center border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity hover:shadow-[3px_3px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[calc(-50%-1px)]"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scrollable product row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[160px] max-w-[200px] flex-shrink-0"
          >
            <ProductCard
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
          </div>
        ))}
      </div>

      {/* Right scroll button */}
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#FFD700] text-[#0A0A0A] flex items-center justify-center border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity hover:shadow-[3px_3px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[calc(-50%-1px)]"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function AllCategoriesProducts() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavStore((s) => s.navigate)
  const { t, language } = useLangStore()

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)
      setError(null)
      try {
        // Fetch categories
        const catRes = await fetch('/api/categories')
        if (!catRes.ok) throw new Error('Failed to fetch categories')
        const catData = await catRes.json()
        const cats: Category[] = (Array.isArray(catData) ? catData : catData.categories || []).map(
          (c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            nameBN: c.nameBN as string | undefined,
            slug: c.slug as string,
            icon: c.icon as string | undefined,
            productCount: (c as Record<string, unknown>)._count
              ? ((c as Record<string, unknown>)._count as Record<string, unknown>).products as number
              : 0,
          })
        )

        // Only show categories that have products
        const catsWithProducts = cats.filter((c) => c.productCount > 0)
        setCategories(catsWithProducts)

        // Fetch products for each category (up to 10 per category)
        const productsMap: Record<string, Product[]> = {}
        await Promise.all(
          catsWithProducts.map(async (cat) => {
            try {
              const prodRes = await fetch(`/api/products?category=${cat.id}&limit=10`)
              if (prodRes.ok) {
                const prodData = await prodRes.json()
                const rawProducts = Array.isArray(prodData) ? prodData : prodData.products || []
                productsMap[cat.id] = rawProducts.map(normalizeProduct)
              }
            } catch {
              // Skip failed category products
            }
          })
        )
        setCategoryProducts(productsMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [])

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            {language === 'en' ? 'Shop by Category' : 'ক্যাটাগরি অনুযায়ী কিনুন'}
          </h2>
          <div className="nb-accent-bar mt-3 w-16" />
        </motion.div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-10">
            {[1, 2, 3].map((i) => (
              <CategoryProductsSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#22C55E] font-bold text-sm hover:underline"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* Category Sections with Products */}
        {!loading && !error && categories.length > 0 && (
          <div className="space-y-10">
            {categories.map((cat, catIndex) => {
              const products = categoryProducts[cat.id] || []
              if (products.length === 0) return null

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: catIndex * 0.05 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-[2px] border-foreground shadow-[2px_2px_0px_var(--foreground)] bg-[#FFD700] text-[#0A0A0A]">
                        {cat.icon ? (
                          <img
                            src={cat.icon}
                            alt={cat.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              if (target.parentElement) {
                                const span = document.createElement('span')
                                span.className = 'text-sm font-bold'
                                span.textContent = cat.name.charAt(0).toUpperCase()
                                target.parentElement.appendChild(span)
                              }
                            }}
                          />
                        ) : (
                          <span className="text-sm font-bold">{cat.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-heading font-black text-foreground">
                          {language === 'bn' && cat.nameBN ? cat.nameBN : cat.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {cat.productCount} {language === 'en' ? 'products' : 'পণ্য'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('categories', { category: cat.slug || cat.id })}
                      className="flex items-center gap-1 text-[#FFD700] text-sm font-bold hover:underline"
                    >
                      {language === 'en' ? 'View All' : 'সব দেখুন'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Horizontal Product Scroll */}
                  <ScrollableProductRow products={products} />
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">
              {language === 'en' ? 'No categories available' : 'কোনো ক্যাটাগরি পাওয়া যায়নি'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
