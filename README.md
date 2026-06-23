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
| Storage | Cloudflare R2 (product images) |
| Realtime | Supabase Realtime (chat) |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| Auth | Custom bcrypt + AdminSession tokens |
| Notifications | Telegram Bot API |
| Fonts | Tinos + Anek Bangla (Google Fonts) |

---

## 📁 Project Structure

```
bangla-bazar/
├── prisma/
│   └── schema.prisma              # PostgreSQL schema (UUID, Decimal, Enums, @db.Timestamptz)
├── public/
│   ├── logo.svg
│   ├── robots.txt
│   └── images/
│       ├── banners/
│       ├── empty-cart.svg
│       ├── empty-search.svg
│       └── products/
├── scripts/
│   └── seed.ts                    # Database seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, ThemeProvider, Toaster)
│   │   ├── page.tsx               # SPA view router
│   │   ├── globals.css            # Theme variables (dark + light)
│   │   ├── robots.ts              # SEO robots.txt generator
│   │   ├── sitemap.ts             # SEO sitemap generator
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Admin panel layout
│   │   │   └── page.tsx           # Admin dashboard
│   │   └── api/
│   │       ├── route.ts           # Health check
│   │       ├── auth/route.ts      # Login, Register, Check-ban
│   │       ├── products/
│   │       │   ├── route.ts       # GET (list) + POST (admin create)
│   │       │   └── [id]/route.ts  # GET, PUT, DELETE single product
│   │       ├── search/route.ts    # Search with auto-ban
│   │       ├── cart/route.ts      # Cart CRUD
│   │       ├── orders/route.ts    # Orders + checkout
│   │       ├── chat/route.ts      # Chat messages
│   │       ├── categories/route.ts# Category CRUD
│   │       ├── telegram-alert/route.ts
│   │       ├── settings/
│   │       │   ├── banner/route.ts  # Maintenance banner settings
│   │       │   └── payment/route.ts # Payment settings
│   │       └── admin/
│   │           ├── route.ts         # Admin dashboard data
│   │           ├── products/route.ts# Admin product management
│   │           ├── categories/[id]/route.ts
│   │           ├── users/route.ts   # Admin users (ban/unban)
│   │           ├── user-logs/route.ts
│   │           └── logout/route.ts
│   ├── components/
│   │   ├── auth/                  # LoginForm, RegisterForm
│   │   ├── cart/                  # CartView
│   │   ├── categories/            # CategoriesView
│   │   ├── chat/                  # ChatView (Supabase Realtime + polling)
│   │   ├── common/                # BannedScreen, MaintenanceBanner
│   │   ├── home/                  # HeroSection, ImageSwiper, FeaturedProducts, CategoryGrid, PromoBanner
│   │   ├── layout/                # Header, BottomNav, Footer, PageTransition
│   │   ├── legal/                 # AboutView, PrivacyView, TermsView
│   │   ├── payment/               # CheckoutView
│   │   ├── products/              # ProductCard, ProductDetail
│   │   ├── profile/               # ProfileView (with full settings panel)
│   │   ├── search/                # SearchView
│   │   └── ui/                    # 50+ shadcn/ui components
│   ├── hooks/                     # use-mobile, use-toast
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── i18n.ts                # Custom EN/BN translations (100+ strings)
│   │   ├── security.ts            # XSS, SQLi, CSRF, rate limiting, auto-ban, checkAndUnbanExpired
│   │   ├── supabase.ts            # Supabase client + realtime helpers
│   │   ├── telegram.ts            # Telegram Bot alerts
│   │   ├── utils.ts               # toNumber, formatPrice, safeJsonParse, discountPercent
│   │   ├── validators.ts          # Zod schemas (auth, product, cart, order)
│   │   └── payment-validator.ts   # BD phone, transaction ID validation
│   └── store/
│       ├── auth-store.ts          # User auth (persisted: bdk-auth)
│       ├── cart-store.ts          # Cart with isInCart() (persisted: bdk-cart)
│       ├── lang-store.ts          # Language + t() translation function (persisted: bdk-lang)
│       └── nav-store.ts           # SPA view router
├── .env                           # Environment variables (NOT committed)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) account (free tier works)
- A [Cloudflare](https://dash.cloudflare.com) account (for R2 storage, free tier: 10GB)

### 1. Clone & Install

```bash
git clone https://github.com/asifkhan135788/Bangla-Bazar.git
cd Bangla-Bazar
npm install
```

### 2. Supabase Setup

Supabase provides your **PostgreSQL database**, **Realtime** (for chat), and optional **Auth**.

#### Step 2a: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Enter project name: `bangla-bazar`
3. Set a strong database password (save it!)
4. Select region closest to Bangladesh (e.g., **Singapore** or **Mumbai**)
5. Wait for the project to provision (~2 minutes)

#### Step 2b: Get Your API Keys

Go to **Project Settings → API** and copy:

| Variable | Where to find |
|----------|--------------|
| `Project URL` | Settings → API → Project URL |
| `anon public` key | Settings → API → Project API keys → anon public |
| `service_role` key | Settings → API → Project API keys → service_role (secret!) |

#### Step 2c: Get Your Database URL

Go to **Project Settings → Database** → scroll to **Connection string** → select **URI** tab:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

You need two versions:
- **`DATABASE_URL`** — uses port `6543` (pooler, for Prisma queries)
- **`DIRECT_URL`** — uses port `5432` (direct, for Prisma migrations)

> ⚠️ If the pooler URL uses port 6543, change it to 5432 for `DIRECT_URL`.

#### Step 2d: Enable Realtime (for Chat)

1. Go to **Database → Replication**
2. Under **Supabase Realtime**, click **Source** and enable:
   - `chat_messages` table
   - `orders` table (optional, for live order updates)
3. If the tables don't exist yet, don't worry — `prisma db push` will create them. Come back here after step 3.

> 💡 **Note:** If you skip this step, chat will still work using **polling fallback** (5-second interval). Realtime is optional.

#### Step 2e: Run Database Migrations

```bash
npx prisma generate
npx prisma db push
```

This creates all tables in your Supabase PostgreSQL:
- `users`, `categories`, `products`, `cart`, `orders`, `order_items`
- `reviews`, `user_logs`, `admin_sessions`, `chat_messages`, `settings`

#### Step 2f: (Optional) Seed Sample Data

```bash
npx tsx scripts/seed.ts
```

### 3. Cloudflare R2 Setup (Product Image Storage)

R2 stores product images with S3-compatible API. Free tier: **10 GB storage + 10M reads/month**.

#### Step 3a: Create an R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **Create bucket**
3. Name it: `bangla-bazar-images`
4. Select location hint: **APAC** (closest to Bangladesh)
5. Click **Create bucket**

#### Step 3b: Create API Token

1. Go to **R2 → Manage R2 API Tokens**
2. Click **Create API token**
3. Permissions: **Object Read & Write**
4. Specify bucket: `bangla-bazar-images`
5. Click **Create API Token**
6. Copy the values:

| Value | Environment Variable |
|-------|---------------------|
| Access Key ID | `R2_ACCESS_KEY_ID` |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` |

#### Step 3c: Get Your R2 Endpoint

1. Go to **R2 → Overview**
2. Find **S3 API** endpoint, it looks like:
   ```
   https://[account-id].r2.cloudflarestorage.com
   ```
3. This is your `R2_ENDPOINT`

#### Step 3d: Enable Public Access (Custom Domain)

1. Go to **R2 → bangla-bazar-images → Settings**
2. Under **Custom Domain**, click **Connect Domain**
3. Enter a subdomain like `img.banglabazar.com` (must be a domain you control in Cloudflare)
4. Or use the **R2.dev subdomain** for development:
   - Click **Allow Access** under R2.dev subdomain
   - You'll get a URL like `https://pub-xxxxx.r2.dev`
5. This public URL is your `R2_PUBLIC_URL`

#### Step 3e: Configure Upload API

The upload API route (`/api/upload`) uses the R2 credentials. When an admin uploads a product image:

```
Admin Panel → POST /api/upload → Cloudflare R2 → Public URL saved to DB → Client displays image
```

---

### 4. Telegram Bot Setup (Order Notifications)

Get notified when customers place orders.

1. Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot`
2. Set bot name and username
3. Copy the **Bot Token**
4. Send a message to your bot, then visit:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
5. Find your **Chat ID** from the response

| Variable | Description |
|----------|------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Your chat/group ID |

> 💡 **Optional:** Skip this if you don't need order notifications. The app works fine without it.

---

### 5. Environment Variables

Create a `.env` file in the project root:

```env
# ═══════════════════════════════════════════
# DATABASE (Supabase PostgreSQL)
# ═══════════════════════════════════════════
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# ═══════════════════════════════════════════
# SUPABASE (Realtime + Auth)
# ═══════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ═══════════════════════════════════════════
# CLOUDFLARE R2 (Image Storage)
# ═══════════════════════════════════════════
R2_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET="bangla-bazar-images"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"    # or https://img.banglabazar.com

# ═══════════════════════════════════════════
# TELEGRAM BOT (Order Notifications - Optional)
# ═══════════════════════════════════════════
TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
TELEGRAM_CHAT_ID="123456789"
```

---

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Admin Access

### Method 1: Create Admin via SQL

Go to **Supabase → SQL Editor** and run:

```sql
-- First, you need a bcrypt-hashed password.
-- Visit https://bcrypt-generator.com/ to generate one, or use this pre-hashed example:
-- Plain text: "admin123"

INSERT INTO users (id, email, name, password, role)
VALUES (
  gen_random_uuid(),
  'admin@banglabazar.com',
  'Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
);
```

### Method 2: Create Admin via API

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"register","email":"admin@banglabazar.com","password":"admin123","name":"Admin"}'
```

Then manually update the role in Supabase SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@banglabazar.com';
```

### Access Admin Panel

Navigate to `/admin` and login with your admin credentials.

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

## 🔧 Useful Commands

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to database (no migration) |
| `npx prisma db pull` | Pull schema from database |
| `npx prisma studio` | Open Prisma GUI database browser |
| `npx tsx scripts/seed.ts` | Seed sample data |

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Client (React)                  │
│  Zustand stores: auth, cart, lang, nav            │
│  Custom i18n with t() — no Google Translate      │
└──────────────────────┬──────────────────────────┘
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                   │
│  /api/auth    → Login, Register, Check-ban       │
│  /api/products→ CRUD (admin)                     │
│  /api/search  → Search + auto-ban                │
│  /api/orders  → Checkout + Telegram alert         │
│  /api/chat    → Chat messages                     │
│  /api/upload  → R2 image upload (admin)           │
└──────┬──────────┬──────────────┬─────────────────┘
       │          │              │
       ▼          ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────────────┐
│ Supabase │ │ Cloudflare│ │ Telegram Bot API │
│ PostgreSQL│ │    R2     │ │  (notifications) │
│ Realtime │ │ (images)  │ └──────────────────┘
└──────────┘ └──────────┘
```

---

## 📄 License

Private project. All rights reserved.

---

<p align="center">
  Made with ❤️ in Bangladesh 🇧🇩
</p>
