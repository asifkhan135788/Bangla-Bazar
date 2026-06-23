'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
}

interface AdminAuth {
  adminToken: string
  adminUser: AdminUser
}

interface Category {
  id: string
  name: string
  nameBN: string | null
  slug: string
  icon: string | null
  active: boolean
  sortOrder: number
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  nameBN: string | null
  description: string | null
  descriptionBN: string | null
  price: number
  salePrice: number | null
  category: string
  images: string
  stock: number
  featured: boolean
  active: boolean
  sku: string | null
  unit: string
  tags: string
  createdAt: string
  categoryRef?: { id: string; name: string; nameBN: string | null }
}

interface Order {
  id: string
  userId: string
  total: number
  status: string
  address: string | null
  phone: string | null
  paymentMethod: string
  note: string | null
  createdAt: string
  user?: { id: string; name: string | null; email: string; phone: string | null }
  orderItems?: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  name: string
  image: string | null
}

interface UserItem {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  avatar: string | null
  createdAt: string
  _count?: { orders: number }
}

interface UserLogItem {
  id: string
  userId: string | null
  action: string
  details: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  user?: { id: string; name: string | null; email: string } | null
}

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
}

type AdminView = 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'user-logs'

// ═══════════════════════════════════════════════════════════════
// API Helper
// ═══════════════════════════════════════════════════════════════

async function adminFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED')
  }
  return res
}

// ═══════════════════════════════════════════════════════════════
// SVG Icons (inline, no emoji)
// ═══════════════════════════════════════════════════════════════

function HomeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BoxIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function GridIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function ShoppingBagIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UsersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function FileTextIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function LogOutIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function MenuIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function PencilIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChevronLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
    case 'confirmed': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    case 'processing': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    case 'shipped': return 'bg-purple-900/40 text-purple-300 border-purple-700'
    case 'delivered': return 'bg-green-900/40 text-green-300 border-green-700'
    case 'cancelled': return 'bg-red-900/40 text-red-300 border-red-700'
    default: return 'bg-gray-800 text-gray-300 border-gray-600'
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sanitize(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ═══════════════════════════════════════════════════════════════
// Admin Login Component
// ═══════════════════════════════════════════════════════════════

function AdminLogin({ onLogin }: { onLogin: (auth: AdminAuth) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      const auth: AdminAuth = {
        adminToken: data.token,
        adminUser: data.user,
      }
      localStorage.setItem('bdk-admin', JSON.stringify(auth))
      onLogin(auth)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FFD700' }}>
              <span className="text-[#0A0A0A] text-2xl font-bold">BB</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Bangla Bazar Admin</h1>
            <p className="text-gray-400 mt-1 text-sm">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-white">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@banglabazar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-medium"
              style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Admin access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Dashboard View
// ═══════════════════════════════════════════════════════════════

function DashboardView({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await adminFetch('/api/admin', token)
        const data = await res.json()
        setStats(data.stats)
        setRecentOrders(data.recentOrders || [])
      } catch {
        // handled by parent
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-[#1A1A1A]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl bg-[#1A1A1A]" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: <BoxIcon className="w-6 h-6" />, color: '#FFD700' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: <ShoppingBagIcon className="w-6 h-6" />, color: '#FFD700' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <UsersIcon className="w-6 h-6" />, color: '#FFD700' },
    { label: 'Total Revenue', value: formatTaka(stats?.totalRevenue ?? 0), icon: <ShoppingBagIcon className="w-6 h-6" />, color: '#FFD700' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '20', color: card.color }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
        <div className="p-6 border-b border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">Order ID</TableHead>
              <TableHead className="text-gray-400">Customer</TableHead>
              <TableHead className="text-gray-400">Items</TableHead>
              <TableHead className="text-gray-400">Total</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">No orders yet</TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order) => (
                <TableRow key={order.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                  <TableCell className="font-mono text-xs text-white">{order.id.slice(-8)}</TableCell>
                  <TableCell className="text-white">{order.user?.name || order.user?.email || 'N/A'}</TableCell>
                  <TableCell className="text-gray-300">{order.orderItems?.length ?? 0}</TableCell>
                  <TableCell className="font-medium text-white">{formatTaka(order.total)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Products View
// ═══════════════════════════════════════════════════════════════

function ProductsView({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formNameBN, setFormNameBN] = useState('')
  const [formImages, setFormImages] = useState('[]')
  const [formDesc, setFormDesc] = useState('')
  const [formDescBN, setFormDescBN] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formSalePrice, setFormSalePrice] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formStock, setFormStock] = useState('0')
  const [formSku, setFormSku] = useState('')
  const [formUnit, setFormUnit] = useState('piece')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formActive, setFormActive] = useState(true)
  const [formTags, setFormTags] = useState('')

  const fetchProducts = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/products?page=${page}&limit=10`, token)
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      // handled by parent
    } finally {
      setLoading(false)
    }
  }, [token, page])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminFetch('/api/categories', token)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      // silent
    }
  }, [token])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setFormName('')
    setFormNameBN('')
    setFormImages('[]')
    setFormDesc('')
    setFormDescBN('')
    setFormPrice('')
    setFormSalePrice('')
    setFormCategory('')
    setFormStock('0')
    setFormSku('')
    setFormUnit('piece')
    setFormFeatured(false)
    setFormActive(true)
    setFormTags('')
    setFormError('')
    setEditProduct(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditProduct(product)
    setFormName(product.name)
    setFormNameBN(product.nameBN || '')
    setFormImages(product.images || '[]')
    setFormDesc(product.description || '')
    setFormDescBN(product.descriptionBN || '')
    setFormPrice(product.price.toString())
    setFormSalePrice(product.salePrice?.toString() || '')
    setFormCategory(product.category)
    setFormStock(product.stock.toString())
    setFormSku(product.sku || '')
    setFormUnit(product.unit)
    setFormFeatured(product.featured)
    setFormActive(product.active)
    try {
      const tagsArr = JSON.parse(product.tags || '[]')
      setFormTags(Array.isArray(tagsArr) ? tagsArr.join(', ') : '')
    } catch {
      setFormTags('')
    }
    setFormError('')
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const adminData = JSON.parse(localStorage.getItem('bdk-admin') || '{}')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminData.adminToken}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()

      const currentImages = JSON.parse(formImages || '[]')
      const newImages = [...currentImages, data.url]
      setFormImages(JSON.stringify(newImages))
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index: number) => {
    const currentImages: string[] = JSON.parse(formImages || '[]')
    const imageUrl = currentImages[index]

    // Try to delete from R2 if it's an R2 URL
    if (imageUrl && (imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage') || imageUrl.includes('img.banglabazar'))) {
      try {
        const adminData = JSON.parse(localStorage.getItem('bdk-admin') || '{}')
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminData.adminToken}`,
          },
          body: JSON.stringify({ url: imageUrl }),
        })
      } catch {
        // Silently fail — image removed from list even if R2 delete fails
      }
    }

    const newImages = currentImages.filter((_: string, i: number) => i !== index)
    setFormImages(JSON.stringify(newImages))
  }

  const handleSave = async () => {
    setFormError('')
    setSaving(true)

    try {
      const body = {
        name: sanitize(formName.trim()),
        nameBN: formNameBN.trim() ? sanitize(formNameBN.trim()) : undefined,
        images: formImages || '[]',
        description: formDesc.trim() ? sanitize(formDesc.trim()) : undefined,
        descriptionBN: formDescBN.trim() ? sanitize(formDescBN.trim()) : undefined,
        price: parseFloat(formPrice),
        salePrice: formSalePrice ? parseFloat(formSalePrice) : null,
        category: formCategory,
        stock: parseInt(formStock) || 0,
        sku: formSku.trim() ? sanitize(formSku.trim()) : undefined,
        unit: formUnit,
        featured: formFeatured,
        active: formActive,
        tags: formTags.trim() ? JSON.stringify(formTags.split(',').map(t => t.trim()).filter(Boolean)) : '[]',
      }

      if (!body.name || !body.price || !body.category) {
        setFormError('Name, price, and category are required')
        setSaving(false)
        return
      }

      let res: Response
      if (editProduct) {
        res = await adminFetch(`/api/products/${editProduct.id}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        res = await adminFetch('/api/products', token, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Failed to save product')
        setSaving(false)
        return
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/products/${id}`, token, { method: 'DELETE' })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchProducts()
      }
    } catch {
      // handled
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40 bg-[#1A1A1A]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Products</h2>
        <Button onClick={openAddModal} style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
          <PlusIcon className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">Image</TableHead>
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Category</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Stock</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                let imgSrc = ''
                try {
                  const imgs = JSON.parse(product.images)
                  imgSrc = imgs[0] || ''
                } catch {
                  imgSrc = ''
                }
                return (
                  <TableRow key={product.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                        {imgSrc ? (
                          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <BoxIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        {product.nameBN && <p className="text-xs text-gray-500">{product.nameBN}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{product.categoryRef?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-white">{formatTaka(product.salePrice ?? product.price)}</span>
                        {product.salePrice && (
                          <span className="text-xs text-gray-500 line-through ml-1">{formatTaka(product.price)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={product.stock <= 5 ? 'text-red-400 font-medium' : 'text-gray-300'}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.active ? (
                          <Badge variant="outline" className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-600">Inactive</Badge>
                        )}
                        {product.featured && (
                          <Badge variant="outline" className="bg-yellow-900/30 text-yellow-300 border-yellow-700">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} title="Edit">
                          <PencilIcon className="w-4 h-4 text-[#FFD700]" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(product.id)} title="Delete">
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm() } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editProduct ? 'Update product details below.' : 'Fill in the details to create a new product.'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Product name" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Name (Bengali)</Label>
              <Input value={formNameBN} onChange={(e) => setFormNameBN(e.target.value)} placeholder="বাংলায় নাম" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>

            {/* Image Upload */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white">Product Images</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(() => {
                  try {
                    return JSON.parse(formImages || '[]').map((img: string, idx: number) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#2A2A2A]">
                        <img src={img} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center text-xs"
                        >
                          x
                        </button>
                      </div>
                    ))
                  } catch {
                    return null
                  }
                })()}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
                  disabled={uploading}
                />
                {uploading && <span className="text-yellow-400 text-sm">Uploading...</span>}
              </div>
              <p className="text-xs text-gray-500">Upload product images (max 5MB each)</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white">Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Product description" rows={3} className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white">Description (Bengali)</Label>
              <Textarea value={formDescBN} onChange={(e) => setFormDescBN(e.target.value)} placeholder="বাংলায় বিবরণ" rows={3} className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Price (৳) *</Label>
              <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" min="0" step="0.01" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Sale Price (৳)</Label>
              <Input type="number" value={formSalePrice} onChange={(e) => setFormSalePrice(e.target.value)} placeholder="0" min="0" step="0.01" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Category *</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="w-full bg-[#0A0A0A] border-[#2A2A2A] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Stock</Label>
              <Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} min="0" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">SKU</Label>
              <Input value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="SKU-001" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Unit</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger className="w-full bg-[#0A0A0A] border-[#2A2A2A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white">Tags (comma-separated)</Label>
              <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="organic, fresh, local" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
              <Label className="text-white">Featured</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="text-white">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm() }} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
              {saving ? 'Saving...' : editProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Product</DialogTitle>
            <DialogDescription className="text-gray-400">Are you sure you want to delete this product? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Categories View
// ═══════════════════════════════════════════════════════════════

function CategoriesView({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formNameBN, setFormNameBN] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formSortOrder, setFormSortOrder] = useState('0')
  const [formActive, setFormActive] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminFetch('/api/categories', token)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setFormName('')
    setFormNameBN('')
    setFormSlug('')
    setFormSortOrder('0')
    setFormActive(true)
    setFormError('')
    setEditCategory(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setEditCategory(cat)
    setFormName(cat.name)
    setFormNameBN(cat.nameBN || '')
    setFormSlug(cat.slug)
    setFormSortOrder(cat.sortOrder.toString())
    setFormActive(cat.active)
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setFormError('')
    setSaving(true)

    try {
      const slug = formSlug.trim() || generateSlug(formName)

      const body = {
        name: sanitize(formName.trim()),
        nameBN: formNameBN.trim() ? sanitize(formNameBN.trim()) : undefined,
        slug,
        sortOrder: parseInt(formSortOrder) || 0,
        active: formActive,
      }

      if (!body.name || !body.slug) {
        setFormError('Name is required')
        setSaving(false)
        return
      }

      let res: Response
      if (editCategory) {
        res = await adminFetch(`/api/admin/categories/${editCategory.id}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        res = await adminFetch('/api/categories', token, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Failed to save category')
        setSaving(false)
        return
      }

      setShowModal(false)
      resetForm()
      fetchCategories()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/categories/${id}`, token, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setDeleteConfirm(null)
        fetchCategories()
      } else {
        setDeleteConfirm(null)
        alert(data.error || 'Failed to delete category')
      }
    } catch {
      setDeleteConfirm(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40 bg-[#1A1A1A]" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Categories</h2>
        <Button onClick={openAddModal} style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
          <PlusIcon className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">Icon</TableHead>
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Slug</TableHead>
              <TableHead className="text-gray-400">Products</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">No categories found</TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
                      {cat.icon ? (
                        <span className="text-lg">{cat.icon}</span>
                      ) : (
                        <GridIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{cat.name}</p>
                      {cat.nameBN && <p className="text-xs text-gray-500">{cat.nameBN}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell className="text-gray-300">{cat._count?.products ?? 0}</TableCell>
                  <TableCell>
                    {cat.active ? (
                      <Badge variant="outline" className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-600">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(cat)} title="Edit">
                        <PencilIcon className="w-4 h-4 text-[#FFD700]" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(cat.id)} title="Delete">
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Category Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm() } }}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editCategory ? 'Update category details.' : 'Create a new product category.'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">{formError}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Name *</Label>
              <Input value={formName} onChange={(e) => { setFormName(e.target.value); if (!editCategory) setFormSlug(generateSlug(e.target.value)) }} placeholder="Category name" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Name (Bengali)</Label>
              <Input value={formNameBN} onChange={(e) => setFormNameBN(e.target.value)} placeholder="বাংলায় নাম" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Slug</Label>
              <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="category-slug" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Sort Order</Label>
              <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} min="0" className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="text-white">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm() }} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
              {saving ? 'Saving...' : editCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Category</DialogTitle>
            <DialogDescription className="text-gray-400">Are you sure? Categories with products cannot be deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Orders View
// ═══════════════════════════════════════════════════════════════

function OrdersView({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      let url = `/api/orders?page=${page}&limit=10`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await adminFetch(url, token)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      const res = await adminFetch('/api/orders', token, {
        method: 'PUT',
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        fetchOrders()
        if (detailOrder?.id === orderId) {
          setDetailOrder({ ...detailOrder, status })
        }
      }
    } catch {
      // handled
    } finally {
      setUpdating(null)
    }
  }

  const openDetail = (order: Order) => {
    setDetailOrder(order)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32 bg-[#1A1A1A]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Orders</h2>
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-[#0A0A0A] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">Order ID</TableHead>
              <TableHead className="text-gray-400">Customer</TableHead>
              <TableHead className="text-gray-400">Items</TableHead>
              <TableHead className="text-gray-400">Total</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Date</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">No orders found</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                  <TableCell className="font-mono text-xs text-white">{order.id.slice(-8)}</TableCell>
                  <TableCell className="text-white">{order.user?.name || order.user?.email || 'N/A'}</TableCell>
                  <TableCell className="text-gray-300">{order.orderItems?.length ?? 0}</TableCell>
                  <TableCell className="font-medium text-white">{formatTaka(order.total)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(order.id, v)}
                      disabled={updating === order.id}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs bg-[#0A0A0A] border-[#2A2A2A] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openDetail(order)} title="View details">
                      <EyeIcon className="w-4 h-4 text-gray-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="sm:max-w-lg bg-[#1A1A1A] border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="text-white">Order Details</DialogTitle>
            <DialogDescription className="text-gray-400">Order #{detailOrder?.id.slice(-8)}</DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Customer</p>
                  <p className="font-medium text-white">{detailOrder.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="font-medium text-white">{detailOrder.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="font-medium text-white">{detailOrder.phone || detailOrder.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Payment</p>
                  <p className="font-medium text-white uppercase">{detailOrder.paymentMethod}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Address</p>
                  <p className="font-medium text-white">{detailOrder.address || 'N/A'}</p>
                </div>
                {detailOrder.note && (
                  <div className="col-span-2">
                    <p className="text-gray-400">Note</p>
                    <p className="font-medium text-white">{detailOrder.note}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#2A2A2A] pt-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Order Items</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailOrder.orderItems?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-[#0A0A0A] rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span className="text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300">{item.quantity} x {formatTaka(item.price)}</p>
                        <p className="font-medium text-white">{formatTaka(item.quantity * item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-4 flex justify-between items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(detailOrder.status)}`}>
                  {detailOrder.status}
                </span>
                <p className="text-lg font-bold text-white">{formatTaka(detailOrder.total)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Users View
// ═══════════════════════════════════════════════════════════════

function UsersView({ token }: { token: string }) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      let url = `/api/admin/users?page=${page}&limit=15`
      if (search) url += `&search=${encodeURIComponent(search)}`
      const res = await adminFetch(url, token)
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [token, page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32 bg-[#1A1A1A]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            className="pl-9 w-64 bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">User</TableHead>
              <TableHead className="text-gray-400">Email</TableHead>
              <TableHead className="text-gray-400">Phone</TableHead>
              <TableHead className="text-gray-400">Role</TableHead>
              <TableHead className="text-gray-400">Orders</TableHead>
              <TableHead className="text-gray-400">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{user.email}</TableCell>
                  <TableCell className="text-gray-300">{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.role === 'admin' ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' : 'bg-gray-800 text-gray-400 border-gray-600'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{user._count?.orders ?? 0}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// User Logs View
// ═══════════════════════════════════════════════════════════════

function UserLogsView({ token }: { token: string }) {
  const [logs, setLogs] = useState<UserLogItem[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      let url = `/api/admin/user-logs?page=${page}&limit=15`
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`
      const res = await adminFetch(url, token)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
      if (data.actionTypes) setActionTypes(data.actionTypes)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [token, page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32 bg-[#1A1A1A]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">User Logs</h2>
        <Select value={actionFilter || 'all'} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44 bg-[#0A0A0A] border-[#2A2A2A] text-white">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-gray-400">Timestamp</TableHead>
              <TableHead className="text-gray-400">User</TableHead>
              <TableHead className="text-gray-400">Action</TableHead>
              <TableHead className="text-gray-400">Details</TableHead>
              <TableHead className="text-gray-400">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">No logs found</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-b border-[#2A2A2A] hover:bg-[#222]">
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                  <TableCell className="text-white">{log.user?.name || log.user?.email || 'System'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30 text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400 max-w-xs truncate">{log.details || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-500 font-mono">{log.ip || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-[#2A2A2A] text-gray-300 hover:bg-[#222]">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sidebar Navigation
// ═══════════════════════════════════════════════════════════════

const navItems: { key: AdminView; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { key: 'products', label: 'Products', icon: <BoxIcon /> },
  { key: 'categories', label: 'Categories', icon: <GridIcon /> },
  { key: 'orders', label: 'Orders', icon: <ShoppingBagIcon /> },
  { key: 'users', label: 'Users', icon: <UsersIcon /> },
  { key: 'user-logs', label: 'User Logs', icon: <FileTextIcon /> },
]

function Sidebar({
  currentView,
  onViewChange,
  onLogout,
  mobileOpen,
  onMobileClose,
}: {
  currentView: AdminView
  onViewChange: (v: AdminView) => void
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFD700' }}>
            <span className="text-[#0A0A0A] text-lg font-bold">BB</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Bangla Bazar</h1>
            <p className="text-yellow-300 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { onViewChange(item.key); onMobileClose() }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentView === item.key
                ? 'bg-[#FFD700] text-[#0A0A0A]'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOutIcon />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0" style={{ backgroundColor: '#0A0A0A' }}>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-64 z-50" style={{ backgroundColor: '#0A0A0A' }}>
            <div className="absolute top-4 right-4">
              <button onClick={onMobileClose} className="text-white p-1">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// Main Admin Panel
// ═══════════════════════════════════════════════════════════════

export default function AdminPage() {
  const [auth, setAuth] = useState<AdminAuth | null>(null)
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bdk-admin')
      if (stored) {
        const data = JSON.parse(stored)
        if (data?.adminToken && data?.adminUser) {
          setAuth(data)
        }
      }
    } catch {
      // ignore
    }
    setInitializing(false)
  }, [])

  const handleLogin = (authData: AdminAuth) => {
    setAuth(authData)
  }

  const handleLogout = async () => {
    if (auth?.adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.adminToken}`,
            'Content-Type': 'application/json',
          },
        })
      } catch {
        // silent
      }
    }
    localStorage.removeItem('bdk-admin')
    setAuth(null)
    setCurrentView('dashboard')
  }

  // Handle 401 - redirect to login
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('bdk-admin')
    setAuth(null)
  }, [])

  // Wrap fetch with 401 handling
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then((response) => {
        if (response.status === 401 && auth) {
          // Check if this is an admin API call
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
          if (url.includes('/api/admin') || (url.includes('/api/') && auth?.adminToken)) {
            // Only auto-logout if the request had an auth header (was meant to be authenticated)
            const options = args[1] as RequestInit | undefined
            const headers = options?.headers as Record<string, string> | undefined
            if (headers?.['Authorization'] || headers?.['authorization']) {
              handleUnauthorized()
            }
          }
        }
        return response
      })
    }
    return () => { window.fetch = originalFetch }
  }, [auth, handleUnauthorized])

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-10 h-10 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: '#FFD700' }} />
      </div>
    )
  }

  if (!auth) {
    return <AdminLogin onLogin={handleLogin} />
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView token={auth.adminToken} />
      case 'products':
        return <ProductsView token={auth.adminToken} />
      case 'categories':
        return <CategoriesView token={auth.adminToken} />
      case 'orders':
        return <OrdersView token={auth.adminToken} />
      case 'users':
        return <UsersView token={auth.adminToken} />
      case 'user-logs':
        return <UserLogsView token={auth.adminToken} />
      default:
        return <DashboardView token={auth.adminToken} />
    }
  }

  return (
    <div className="min-h-screen bg-[#111]">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-40 bg-[#1A1A1A] border-b border-[#2A2A2A] lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => setMobileMenuOpen(true)} className="text-gray-400">
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-white">Bangla Bazar Admin</h1>
            <div className="w-6" />
          </div>
        </header>

        {/* Top bar for desktop */}
        <header className="hidden lg:flex items-center justify-between px-8 h-16 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <div>
            <h2 className="text-lg font-semibold text-white capitalize">{currentView.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#FFD700', color: '#0A0A0A' }}>
              {(auth.adminUser.name || auth.adminUser.email)[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-300">{auth.adminUser.name || auth.adminUser.email}</span>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
