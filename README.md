# 🏪 Bangla Bazar

**Bangladesh's Favorite Online Store** — A modern, mobile-first e-commerce platform built with Next.js 16, TypeScript, and Tailwind CSS 4.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)

---

## 🌟 Features

### 🛍️ E-Commerce Core
- **Product Catalog** — Browse Sharee, Punjabi, Shoes, Jewellery, Electronics
- **Product Details** — Image carousel, ratings, buy count, stock status, quantity selector
- **Search** — Real-time DB search with filters (category, price, sort), debounced input
- **Featured Products** — Admin-controlled featured collection on homepage
- **Card Stack Swiper** — Tinder-style swipe card for trending collections

### 🛒 Shopping Cart & Checkout
- **Persistent Cart** — Zustand + localStorage, add/remove/update quantities
- **Toast Notifications** — Login required, already in cart, added to cart
- **Checkout** — bKash / Nagad / Rocket / COD, transaction ID input, BD phone validation
- **COD Delivery Notice** — ৳60 delivery charge clearly displayed
- **Telegram Alerts** — Order notifications sent to admin via Telegram bot

### 👤 User System
- **Auth** — Custom bcrypt-based login/register with admin sessions
- **Profile** — Edit name, phone, address; view order history
- **Banned Screen** — Auto-ban (3 days) for malicious search input, with countdown timer and CS chat link
- **Admin Panel** — Full product/category/user management at `/admin`

### 🌐 Custom Bengali i18n (No Google Translate!)
- **Built-in Translations** — 100+ UI strings in EN/BN via `src/lib/i18n.ts`
- **One-click Toggle** — Language switch instantly updates all text
- **No External Dependencies** — No Google Translate widget, no page reload, no hydration issues

### 🎨 Theming & UI
- **Dark/Light Mode** — `next-themes` with Bangladesh-inspired Gold (#FFD700) + Dark (#0A0A0A) palette
- **Mobile-first** — Floating pill bottom nav, safe area insets, smooth animations
- **Framer Motion** — Page transitions, typewriter hero, animated cards
- **Fonts** — Tinos (English serif headings) + Anek Bangla (Bengali text)

### 💬 Chat System
- **Customer Support Chat** — Direct chat with admin/support team
- **Seller Chat** — Per-product seller communication
- **Supabase Realtime** — Live message delivery (polling fallback if unconfigured)
- **Input Sanitization** — HTML stripped from all chat messages

### 🔒 Security
- **XSS Protection** — `sanitizeInput()`, `sanitizeHtml()` with whitelist
- **SQL Injection** — `escapeLikePattern()`, Prisma parameterized queries
- **Auto-Ban** — Malicious search input detected → 3-day ban with `bannedUntil`
- **Rate Limiting** — Login: 5 attempts / 15 min per IP
- **CSRF Tokens** — Timing-safe comparison
- **Security Headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Admin Auth** — Bearer token via AdminSession with 24h expiry

### 📱 PWA-Ready
- **Sticky Header** — Scroll-aware shadow, hamburger menu drawer
- **Fixed Bottom Nav** — Animated pill nav, cart badge, safe area support
- **Maintenance Banner** — Admin-controlled popup (info/warning/error types)
- **SEO** — Sitemap, robots.txt, Open Graph, Twitter Cards

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand 5 (persisted) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| Auth | Custom bcrypt + AdminSession tokens |
| Realtime | Supabase Realtime (chat) |
| Notifications | Telegram Bot API |
| Fonts | Tinos + Anek Bangla (Google Fonts) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, ThemeProvider, Toaster)
│   ├── page.tsx            # SPA view router
│   ├── globals.css         # Theme variables (dark + light)
│   ├── admin/              # Admin panel
│   └── api/                # API routes
│       ├── auth/           # Login, Register, Check-ban
│       ├── products/       # CRUD products
│       ├── search/         # Search with auto-ban
│       ├── cart/           # Cart operations
│       ├── orders/         # Order management
│       ├── chat/           # Chat messages
│       ├── categories/     # Category CRUD
│       ├── settings/       # Banner & payment settings
│       ├── telegram-alert/ # Order notifications
│       └── admin/          # Admin-only routes (users, products, categories)
├── components/
│   ├── auth/               # LoginForm, RegisterForm
│   ├── cart/               # CartView
│   ├── categories/         # CategoriesView
│   ├── chat/               # ChatView (Supabase Realtime)
│   ├── common/             # BannedScreen, MaintenanceBanner
│   ├── home/               # HeroSection, ImageSwiper, FeaturedProducts, CategoryGrid, PromoBanner
│   ├── layout/             # Header, BottomNav, Footer, PageTransition
│   ├── legal/              # AboutView, PrivacyView, TermsView
│   ├── payment/            # CheckoutView
│   ├── products/           # ProductCard, ProductDetail
│   ├── profile/            # ProfileView (with full settings)
│   ├── search/             # SearchView
│   └── ui/                 # shadcn/ui components (50+)
├── hooks/                  # use-mobile, use-toast
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── i18n.ts             # Custom EN/BN translations (100+ strings)
│   ├── security.ts         # XSS, SQLi, CSRF, rate limiting, auto-ban
│   ├── supabase.ts         # Supabase client + realtime helpers
│   ├── telegram.ts         # Telegram Bot alerts
│   ├── utils.ts            # toNumber, formatPrice, safeJsonParse, discountPercent
│   ├── validators.ts       # Zod schemas
│   └── payment-validator.ts # BD phone, transaction ID validation
├── store/
│   ├── auth-store.ts       # User auth (persisted)
│   ├── cart-store.ts       # Cart with isInCart() (persisted)
│   ├── lang-store.ts       # Language + t() translation function
│   └── nav-store.ts        # SPA view router
prisma/
└── schema.prisma           # PostgreSQL schema (UUID, Decimal, Enums)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database (Supabase recommended)

### 1. Clone & Install

```bash
git clone https://github.com/asifkhan135788/Bangla-Bazar.git
cd Bangla-Bazar
npm install
```

### 2. Environment Setup

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/banglabazar"
DIRECT_URL="postgresql://user:password@host:5432/banglabazar"

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Admin Access

1. Create an admin user directly in the database:
```sql
-- Password: admin123 (bcrypt hashed)
INSERT INTO users (id, email, name, password, role)
VALUES (
  gen_random_uuid(),
  'admin@banglabazar.com',
  'Admin',
  '$2a$10$hash...',
  'admin'
);
```

2. Navigate to `/admin` and login

---

## 🌐 Adding Translations

All UI text is in `src/lib/i18n.ts`. To add/modify translations:

```typescript
// src/lib/i18n.ts
const translations = {
  en: {
    newKey: 'New English Text',
  },
  bn: {
    newKey: 'নতুন বাংলা টেক্সট',
  },
}
```

Then use in components:
```tsx
const { t } = useLangStore()
return <span>{t('newKey')}</span>
```

---

## 📄 License

Private project. All rights reserved.

---

<p align="center">
  Made with ❤️ in Bangladesh 🇧🇩
</p>
