'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useNavStore } from '@/store/nav-store'
import { useLangStore } from '@/store/lang-store'

export interface ProductCardProps {
  id: string
  name: string
  nameBN?: string
  price: number
  salePrice?: number | null
  image?: string | null
  stock?: number
  rating?: number
  buyCount?: number
  unit?: string
  category?: string
}

export function ProductCard({
  id,
  name,
  nameBN,
  price,
  salePrice,
  image,
  stock = 0,
  rating = 0,
  buyCount = 0,
  unit = 'piece',
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const isInCart = useCartStore((s) => s.isInCart)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavStore((s) => s.navigate)
  const { t } = useLangStore()

  const inCart = isInCart(id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error(t('loginRequired'))
      navigate('login')
      return
    }

    if (inCart) {
      toast(t('alreadyInCart'))
      return
    }

    addItem({
      id,
      productId: id,
      name,
      nameBN,
      price,
      salePrice: salePrice ?? undefined,
      image: image ?? undefined,
      stock,
    })
    toast.success(t('addedToCart'))
  }

  const effectivePrice = salePrice ?? price ?? 0
  const hasDiscount = salePrice != null && price != null && salePrice < price
  const discountPct = hasDiscount ? Math.round(((price - salePrice!) / price) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group"
      onClick={() => navigate('product-detail', { productId: id })}
    >
      {/* Image */}
      <div className="relative aspect-square bg-input overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFD700] text-[#0A0A0A]">
            -{discountPct}% OFF
          </span>
        )}

        {/* Out of stock */}
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-foreground font-semibold text-sm bg-input px-3 py-1 rounded-full">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {name}
        </h3>
        {nameBN && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{nameBN}</p>
        )}

        {/* Rating + Buy Count */}
        {(rating > 0 || buyCount > 0) && (
          <div className="flex items-center gap-2 mt-1.5">
            {rating > 0 && (
              <div className="flex items-center gap-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
              </div>
            )}
            {buyCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {buyCount >= 1000
                  ? `${(buyCount / 1000).toFixed(1)}k`
                  : buyCount}{' '}
                {t('sold')}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-[#FFD700]">
            ৳{effectivePrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ৳{(price ?? 0).toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {`${t('per')} ${unit}`}
        </p>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0 || inCart}
          className="mt-2 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#FFD700] text-[#0A0A0A] hover:bg-[#FFE44D] disabled:hover:bg-[#FFD700]"
        >
          {stock === 0
            ? t('outOfStock')
            : inCart
              ? t('alreadyInCart')
              : t('addToCart')}
        </button>
      </div>
    </motion.div>
  )
}
