import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Prisma Decimal value to a JavaScript number.
 * Handles Decimal objects, strings, numbers, and null/undefined.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  // Prisma Decimal objects have .toString() and can be converted
  if (typeof value === 'object' && 'toString' in value) {
    return parseFloat(String(value)) || 0
  }
  return 0
}

/**
 * Formats a number as a Bangladeshi Taka price string.
 * Example: 1250 → "৳1,250"
 */
export function formatPrice(value: unknown): string {
  const num = toNumber(value)
  return `৳${num.toLocaleString('en-BD')}`
}

/**
 * Safely parses a JSON string or returns the value if already parsed.
 * Used for fields like `images` and `tags` which are String[] in PostgreSQL
 * but may come as JSON strings from the API.
 */
export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed as T
      return fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

/**
 * Calculates the discount percentage between original and sale price.
 */
export function discountPercent(price: number, salePrice: number | null | undefined): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0
  return Math.round(((price - salePrice) / price) * 100)
}
