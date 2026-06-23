import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

// Product schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  nameBN: z.string().optional(),
  description: z.string().optional(),
  descriptionBN: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().positive('Sale price must be positive').optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  images: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  tags: z.string().optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameBN: z.string().optional(),
  description: z.string().optional(),
  descriptionBN: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().optional().nullable(),
  category: z.string().min(1).optional(),
  images: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  tags: z.string().optional(),
})

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  nameBN: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').max(100),
  image: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
})

// Cart schemas
export const addToCartSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

// Order schemas
export const checkoutSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(2, 'Name is required').max(100, 'Name too long').optional(),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'rocket', 'card']).default('cod'),
  transactionId: z.string().optional(),
  note: z.string().optional(),
})

// Admin schemas
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
})
