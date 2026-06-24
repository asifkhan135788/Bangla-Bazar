'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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

function ProductCardSkeleton() {
  return <ProductCardLoader />
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavStore((s) => s.navigate)
  const { t } = useLangStore()

  useEffect(() => {
    async function fetchFeatured() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/products?featured=true')
        if (!res.ok) throw new Error('Failed to fetch products')
        const data = await res.json()
        const rawProducts = Array.isArray(data) ? data : data.products || []
        setProducts(rawProducts.map(normalizeProduct))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

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
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            {t('featuredCollection')}
          </h2>
          <div className="nb-accent-bar mt-3 w-16" />
        </motion.div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
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

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">
              {t('noFeaturedProducts')}
            </p>
          </div>
        )}

        {/* View All Button */}
        {!loading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() => navigate('categories')}
              className="nb-btn-sm border-[3px] border-[#FFD700] text-[#FFD700] shadow-[4px_4px_0px_var(--foreground)] hover:shadow-[5px_5px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-2 px-6 py-2.5 text-sm transition-all"
            >
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
