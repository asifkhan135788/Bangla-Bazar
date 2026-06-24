'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Minus, Plus, ShoppingCart, Zap, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'
import { toNumber, safeJsonParse } from '@/lib/utils'

interface ProductApi {
  id: string
  name: string
  nameBN?: string
  description?: string
  descriptionBN?: string
  price: unknown
  salePrice?: unknown
  images: unknown
  rating: unknown
  reviewCount?: unknown
  buyCount?: unknown
  stock: number
  categoryRef?: { id: string; name: string; nameBN?: string; slug: string }
}

interface Product {
  id: string
  name: string
  nameBN?: string
  description?: string
  descriptionBN?: string
  price: number
  salePrice: number | null
  images: string[]
  rating: number
  reviewCount: number
  buyCount: number
  stock: number
  categoryRef?: { id: string; name: string; nameBN?: string; slug: string }
}

function normalizeProduct(raw: ProductApi): Product {
  return {
    id: raw.id,
    name: raw.name,
    nameBN: raw.nameBN,
    description: raw.description,
    descriptionBN: raw.descriptionBN,
    price: toNumber(raw.price),
    salePrice: raw.salePrice != null ? toNumber(raw.salePrice) : null,
    images: safeJsonParse<string[]>(raw.images, []),
    rating: toNumber(raw.rating),
    reviewCount: toNumber(raw.reviewCount),
    buyCount: toNumber(raw.buyCount),
    stock: raw.stock ?? 0,
    categoryRef: raw.categoryRef,
  }
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'text-[#FFD700] fill-[#FFD700]'
              : 'text-border fill-border'
          }`}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  const addItem = useCartStore((s) => s.addItem)
  const goBack = useNavStore((s) => s.goBack)
  const navigate = useNavStore((s) => s.navigate)
  const { isAuthenticated } = useAuthStore()
  const { t } = useLangStore()

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error('Product not found')
        const data = await res.json()
        const raw = data.product || data
        setProduct(normalizeProduct(raw))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const displayImages =
    product && product.images.length > 0
      ? product.images.map((img, i) => (imgErrors.has(i) ? '/images/products/product-placeholder.svg' : img))
      : ['/images/products/product-placeholder.svg']

  const discountPercent =
    product?.salePrice && product.price > 0
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0

  const inStock = product ? product.stock > 0 : false
  const isLowStock = product ? product.stock > 0 && product.stock <= 5 : false

  const getStockLabel = () => {
    if (!product) return null
    if (product.stock === 0)
      return <span className="text-sm font-bold text-red-500">{t('outOfStock')}</span>
    if (product.stock <= 5)
      return <span className="text-sm font-bold text-[#FFD700]">{`${t('lowStock')} (${product.stock} ${t('left')})`}</span>
    return <span className="text-sm font-bold text-green-500">{t('inStock')}</span>
  }

  const handleAddToCart = useCallback(() => {
    if (!product || !inStock) return

    if (!isAuthenticated) {
      toast.error(t('loginRequired'))
      navigate('login')
      return
    }

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      nameBN: product.nameBN,
      price: product.price,
      salePrice: product.salePrice ?? undefined,
      image: displayImages[0],
      stock: product.stock,
      quantity,
    })
    toast.success(t('addedToCart'))
  }, [product, inStock, isAuthenticated, addItem, quantity, displayImages, t, navigate])

  const handleBuyNow = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(t('loginFirst'))
      navigate('login')
      return
    }
    handleAddToCart()
    navigate('checkout')
  }, [handleAddToCart, isAuthenticated, t, navigate])

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-24 rounded-xl bg-[#FFD700]/10 border-[3px] border-foreground" />
          <div className="aspect-square w-full rounded-xl bg-[#FFD700]/10 border-[3px] border-foreground" />
          <div className="h-6 w-3/4 rounded bg-[#FFD700]/10" />
          <div className="h-4 w-1/2 rounded bg-[#FFD700]/10" />
          <div className="h-8 w-32 rounded bg-[#FFD700]/10" />
          <div className="h-20 w-full rounded bg-[#FFD700]/10" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-lg text-muted-foreground mb-4">{error || 'Product not found'}</p>
        <button
          onClick={goBack}
          className="nb-btn-sm bg-[#FFD700] text-[#0A0A0A] flex items-center gap-2 px-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('goBack')}
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Back Button */}
      <div className="sticky top-0 z-10 flex items-center bg-background px-4 py-3 border-b-[3px] border-foreground shadow-[0_3px_0_0_var(--foreground)]">
        <button
          onClick={goBack}
          className="nb-btn-sm bg-card text-foreground flex items-center gap-1 px-3 py-1.5 text-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('back')}
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        {/* Image Carousel */}
        <div className="nb-card-static relative overflow-hidden bg-card aspect-square border-[3px] border-foreground">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={displayImages[currentImageIndex]}
              alt={product.name}
              onError={() => {
                setImgErrors((prev) => new Set(prev).add(currentImageIndex))
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card border-[3px] border-foreground shadow-[2px_2px_0px_var(--foreground)] hover:shadow-[3px_3px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-50%] active:shadow-[0px_0px_0px_var(--foreground)] active:translate-x-[2px] transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card border-[3px] border-foreground shadow-[2px_2px_0px_var(--foreground)] hover:shadow-[3px_3px_0px_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-50%] active:shadow-[0px_0px_0px_var(--foreground)] active:translate-x-[2px] transition-all"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          {/* Sale Badge */}
          {product.salePrice && discountPercent > 0 && (
            <div className="nb-sticker absolute top-3 left-3 bg-[#22C55E] text-white -rotate-3">
              -{discountPercent}% OFF
            </div>
          )}

          {/* Dots Indicator */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`rounded-full transition-all ${
                    i === currentImageIndex
                      ? 'h-3 w-5 bg-[#22C55E]'
                      : 'h-2.5 w-2.5 bg-foreground/40 hover:bg-foreground/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <h1 className="font-heading font-black text-xl text-foreground leading-tight">
            {product.name}
          </h1>
          {product.nameBN && (
            <p className="text-base text-muted-foreground">{product.nameBN}</p>
          )}

          {/* Rating + Buy Count */}
          {(product.rating > 0 || product.buyCount > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} size="sm" />
                  <span className="text-sm text-muted-foreground font-bold">
                    {product.rating.toFixed(1)} ({product.reviewCount ?? 0} {t('reviews')})
                  </span>
                </div>
              )}
              {product.buyCount > 0 && (
                <span className="text-sm text-muted-foreground font-bold">
                  {product.buyCount >= 1000
                    ? `${(product.buyCount / 1000).toFixed(1)}k`
                    : product.buyCount}{' '}
                  {t('sold')}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 pt-1">
            {product.salePrice ? (
              <>
                <span className="font-black text-[#FFD700] text-2xl">
                  ৳{product.salePrice.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ৳{product.price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="font-black text-[#FFD700] text-2xl">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full border-2 border-foreground ${
                !inStock
                  ? 'bg-red-500'
                  : isLowStock
                  ? 'bg-[#FFD700]'
                  : 'bg-green-500'
              }`}
            />
            {getStockLabel()}
          </div>
        </div>

        {/* Description */}
        {(product.description || product.descriptionBN) && (
          <div className="border-t-[3px] border-foreground pt-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground">
              {t('description')}
            </h3>
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
            {product.descriptionBN && (
              <p className="text-sm text-muted-foreground/70 leading-relaxed whitespace-pre-line">
                {product.descriptionBN}
              </p>
            )}
          </div>
        )}

        {/* Quantity Selector */}
        {inStock && (
          <div className="border-t-[3px] border-foreground pt-4">
            <h3 className="text-sm font-bold text-foreground mb-3">
              {t('quantity')}
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="nb-btn-sm flex h-10 w-10 items-center justify-center border-[2.5px] border-foreground text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-lg font-bold text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="nb-btn-sm flex h-10 w-10 items-center justify-center border-[2.5px] border-foreground text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground ml-1 font-bold">
                ({t('max')}: {product.stock})
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background border-t-[3px] border-foreground pt-4 pb-6 -mx-4 px-4 space-y-3">
          {inStock ? (
            <>
              <button
                onClick={handleAddToCart}
                className="nb-btn w-full bg-[#FFD700] text-[#0A0A0A] uppercase flex items-center justify-center gap-2 py-3.5 text-base"
              >
                <ShoppingCart className="h-5 w-5" />
                {t('addToCart')}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleBuyNow}
                  className="nb-btn flex-1 bg-transparent border-[3px] border-[#FFD700] text-[#FFD700] flex items-center justify-center gap-2 py-3.5 text-base"
                >
                  <Zap className="h-5 w-5" />
                  {t('buyNow')}
                </button>
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate('chat', { senderId: 'admin' })
                    } else {
                      navigate('login')
                    }
                  }}
                  className="nb-btn bg-[#22C55E] text-[#0A0A0A] flex items-center justify-center gap-2 py-3.5 px-4 text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              disabled
              className="nb-btn w-full bg-input text-muted-foreground flex items-center justify-center gap-2 py-3.5 text-base cursor-not-allowed"
            >
              {t('outOfStock')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
