import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE_URL = 'https://banglabazar.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Fetch categories for category pages
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await db.category.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: 'asc' },
    })

    categoryPages = categories.map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // If database is unavailable, skip category pages
  }

  // Fetch products for product pages
  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await db.product.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to avoid oversized sitemaps
    })

    productPages = products.map((product) => ({
      url: `${BASE_URL}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // If database is unavailable, skip product pages
  }

  return [...staticPages, ...categoryPages, ...productPages]
}
