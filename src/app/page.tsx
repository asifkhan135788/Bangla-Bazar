'use client'

import { useEffect } from 'react'
import { useNavStore } from '@/store/nav-store'
import { useAuthStore } from '@/store/auth-store'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PageTransition from '@/components/layout/PageTransition'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CategoryGrid from '@/components/home/CategoryGrid'
import PromoBanner from '@/components/home/PromoBanner'
import ProductDetail from '@/components/products/ProductDetail'
import { CartView } from '@/components/cart/CartView'
import { SearchView } from '@/components/search/SearchView'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ProfileView } from '@/components/profile/ProfileView'
import { CategoriesView } from '@/components/categories/CategoriesView'
import { CheckoutView } from '@/components/payment/CheckoutView'
import { ChatView } from '@/components/chat/ChatView'
import { BannedScreen } from '@/components/common/BannedScreen'
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner'
import { PrivacyView } from '@/components/legal/PrivacyView'
import { TermsView } from '@/components/legal/TermsView'
import { AboutView } from '@/components/legal/AboutView'
import { ImageSwiper } from '@/components/home/ImageSwiper'

function HomeView() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
            Trending Collections
          </h2>
          <div className="mt-3 nb-accent-bar w-20" />
          <div className="mt-8 flex justify-center">
            <ImageSwiper />
          </div>
        </div>
      </div>
      <CategoryGrid />
      <PromoBanner />
      <FeaturedProducts />
    </div>
  )
}

export default function Home() {
  const { currentView, selectedProductId, navigate } = useNavStore()
  const { login, user, isAuthenticated } = useAuthStore()

  // Restore view from URL on first load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view')
      const productId = params.get('productId')
      const category = params.get('category')
      const query = params.get('query')
      const senderId = params.get('senderId')

      if (view) {
        navigate(view as any, {
          productId: productId || undefined,
          category: category || undefined,
          query: query || undefined,
          senderId: senderId || undefined,
        })
      }
    } catch {
      // Ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bdk-auth')
      if (stored) {
        const data = JSON.parse(stored)
        if (data?.state?.user && data?.state?.token) {
          login(data.state.user, data.state.token)
        }
      }
    } catch {
      // Ignore
    }
  }, [login])

  // Handle Google Auth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authSuccess = params.get('auth_success')
    const authError = params.get('auth_error')
    const userData = params.get('user_data')

    if (authSuccess && userData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userData))
        if (parsed.user) {
          login(parsed.user, parsed.token || '')
        }
      } catch {
        // Ignore parse errors
      }
      // Clean URL
      window.history.replaceState({}, '', '/')
    }

    if (authError) {
      console.error('Auth error:', authError)
      window.history.replaceState({}, '', '/')
    }
  }, [login])

  // Check if ban has expired on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_ban', userId: user.id }),
      }).catch(() => {
        // Silently fail
      })
    }
  }, [isAuthenticated, user?.id])

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'categories':
        return <CategoriesView />
      case 'cart':
        return <CartView />
      case 'profile':
        return <ProfileView />
      case 'search':
        return <SearchView />
      case 'product-detail':
        return selectedProductId ? <ProductDetail productId={selectedProductId} /> : <HomeView />
      case 'checkout':
        return <CheckoutView />
      case 'login':
        return <LoginForm />
      case 'register':
        return <RegisterForm />
      case 'chat':
        return <ChatView />
      case 'privacy':
        return <PrivacyView />
      case 'terms':
        return <TermsView />
      case 'about':
        return <AboutView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BannedScreen />
      <MaintenanceBanner />
      <Header />
      <main className="flex-1 pt-14 pb-24">
        <PageTransition viewKey={currentView}>
          {renderView()}
        </PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
