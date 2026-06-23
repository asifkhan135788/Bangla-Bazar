# 🏪 Bangla Bazar

**Bangladesh's Favorite Online Store** — A modern, mobile-first e-commerce platform built with Next.js 16, TypeScript, and Tailwind CSS 4.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)
![Security](https://img.shields.io/badge/RLS-Enabled-brightgreen?logo=shield)

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
- **Row Level Security (RLS)** — Every table protected with role-based policies
- **XSS Protection** — `sanitizeInput()`, `sanitizeHtml()` with whitelist
- **SQL Injection** — `escapeLikePattern()`, Prisma parameterized queries
- **Auto-Ban** — Malicious search input detected → 3-day ban with `bannedUntil`
- **Rate Limiting** — Login: 5 attempts / 15 min per IP
- **CSRF Tokens** — Timing-safe comparison
- **Security Headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Admin Auth** — Bearer token via AdminSession with 24h expiry
- **Schema Permissions** — Revoked public schema access, granular GRANT system

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
| Security | Row Level Security (RLS) on all tables |

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
├── supabase-schema.sql            # 🆕 Full SQL with RLS policies (run in Supabase SQL Editor)
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

Supabase provides your **PostgreSQL database**, **Realtime** (for chat), and **Row Level Security**.

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

#### Step 2d: Run the SQL Schema (RECOMMENDED)

This is the **recommended** way to set up the database — it creates all tables **with Row Level Security policies**.

1. Go to **Supabase → SQL Editor**
2. Click **New Query**
3. Copy the **entire contents** of `supabase-schema.sql` from this repo
4. Paste it into the SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)

This single script will:
- ✅ Create all 4 enum types (`UserRole`, `OrderStatus`, `PaymentMethod`, `SenderType`)
- ✅ Create all 11 tables with proper constraints and indexes
- ✅ Add `updatedAt` auto-update triggers
- ✅ **Enable RLS on every table**
- ✅ Create **30+ security policies** (anon, authenticated, admin)
- ✅ Add helper functions (`is_admin()`, `is_not_banned()`)
- ✅ Configure schema permissions (revoke public access)
- ✅ Enable Realtime for `chat_messages` and `orders`
- ✅ Create default admin user (email: `admin@banglabazar.com`, password: `admin123`)

> ⚠️ **IMPORTANT:** Change the default admin password immediately after first login!

#### Step 2e: Alternative — Prisma DB Push (WITHOUT RLS)

If you don't need RLS policies, you can use Prisma instead:

```bash
npx prisma generate
npx prisma db push
```

This creates tables but **does NOT** enable RLS or security policies. For production, **always use the SQL method above**.

#### Step 2f: Verify RLS is Working

After running the SQL, verify with these queries in SQL Editor:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check Realtime is configured
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Expected output for `rowsecurity`:
| tablename | rowsecurity |
|-----------|-------------|
| admin_sessions | t |
| cart | t |
| categories | t |
| chat_messages | t |
| order_items | t |
| orders | t |
| products | t |
| reviews | t |
| settings | t |
| user_logs | t |
| users | t |

#### Step 2g: (Optional) Seed Sample Data

```bash
npx tsx scripts/seed.ts
```

---

## 🛡️ Row Level Security (RLS) — Detailed Reference

### Security Model

```
┌──────────────────────────────────────────────────────────┐
│                   HOW RLS WORKS HERE                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. API Routes (Next.js Server)                           │
│     → Uses Prisma with direct DB connection               │
│     → BYPASSES RLS (equivalent to superuser)              │
│     → All CRUD operations are secure via API auth         │
│                                                           │
│  2. Server Supabase Client                                │
│     → Uses service_role key                               │
│     → BYPASSES RLS                                        │
│     → Used for server-side Realtime, admin ops            │
│                                                           │
│  3. Browser Supabase Client                               │
│     → Uses anon public key                                │
│     → RLS POLICES APPLY HERE                              │
│     → Limited read-only access for Realtime               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Policy Summary Table

| Table | anon SELECT | anon INSERT/UPDATE/DELETE | authenticated SELECT | authenticated WRITE | Admin |
|-------|-------------|--------------------------|---------------------|--------------------|----|
| `users` | ❌ DENY | ❌ DENY | Own row only | Own profile (no role/banned change) | Via service_role |
| `categories` | ✅ Active only | ❌ DENY | All | ❌ DENY | ✅ Full CRUD |
| `products` | ✅ Active only | ❌ DENY | All | ❌ DENY | ✅ Full CRUD |
| `cart` | ❌ DENY | ❌ DENY | Own items | Own items | Via service_role |
| `orders` | ✅ Limited* | ❌ DENY | Own + Admin read | Own insert, Admin update | ✅ Status update |
| `order_items` | ✅ Limited* | ❌ DENY | Own + Admin read | Own insert | Via service_role |
| `reviews` | ✅ All | ❌ DENY | All | Own + Admin delete | ✅ Delete any |
| `user_logs` | ❌ DENY | ❌ DENY | Admin only | ❌ DENY | ✅ Read |
| `admin_sessions` | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Via service_role only |
| `chat_messages` | ✅ Limited* | ❌ DENY | Own conversations | Own messages + Admin | ✅ Full |
| `settings` | ✅ All | ❌ DENY | All | Admin only | ✅ Full CRUD |

> \* **Limited**: anon can read for Realtime subscriptions, but client-side filters further restrict visible data.

### Helper Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `is_admin()` | Checks if current Supabase Auth user has admin role | RLS policies |
| `is_not_banned()` | Checks if user is not banned and ban hasn't expired | RLS policies |
| `update_updated_at_column()` | Auto-updates `updatedAt` on row modification | Triggers |

### Why RLS Matters

1. **Defense in Depth** — Even if the API is compromised, the database rejects unauthorized access
2. **Direct Supabase Client Protection** — The anon key is public (embedded in frontend JS). RLS ensures it can't be abused
3. **Realtime Security** — Chat and order Realtime subscriptions only expose allowed data
4. **Compliance** — Meets security best practices for PII handling (passwords, addresses, phone numbers)

### Upgrading to Supabase Auth (Future)

Currently, the app uses **custom bcrypt auth** with admin sessions. For even stronger RLS:

1. Migrate user authentication to **Supabase Auth** (built-in)
2. Replace `is_admin()` with JWT custom claims: `auth.jwt() → role`
3. Replace anon policies with `authenticated` role policies
4. This enables `auth.uid()` matching in all policies automatically

---

## 🔑 Admin Access

### Default Admin (Created by SQL Schema)

The `supabase-schema.sql` script creates a default admin:

| Field | Value |
|-------|-------|
| Email | `admin@banglabazar.com` |
| Password | `admin123` |
| Role | `admin` |

> ⚠️ **CHANGE THIS PASSWORD IMMEDIATELY** after first login!

### Method 2: Create Admin via API

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"register","email":"admin@banglabazar.com","password":"YourStrongPassword!","name":"Admin"}'
```

Then manually update the role in Supabase SQL Editor:

```sql
UPDATE "users" SET "role" = 'admin' WHERE "email" = 'admin@banglabazar.com';
```

### Access Admin Panel

Navigate to `/admin` and login with your admin credentials.

---

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

### 6. Generate Prisma Client & Run

```bash
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Useful Commands

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to database (no RLS!) |
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
│  Supabase anon client → RLS policies apply       │
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
│                                                   │
│  Uses Prisma → direct DB (bypasses RLS)          │
│  Uses Supabase service_role (bypasses RLS)       │
└──────┬──────────┬──────────────┬─────────────────┘
       │          │              │
       ▼          ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────────────┐
│ Supabase │ │ Cloudflare│ │ Telegram Bot API │
│ PostgreSQL│ │    R2     │ │  (notifications) │
│ 🔒 RLS   │ │ (images)  │ └──────────────────┘
│ Realtime │ └──────────┘
└──────────┘
```

---

## 🗃️ Database Schema

```
users ──────────┐
  ├── cart      │ (userId → users.id, CASCADE)
  ├── orders    │ (userId → users.id, RESTRICT)
  ├── reviews   │ (userId → users.id, CASCADE)
  ├── user_logs │ (userId → users.id, SET NULL)
  ├── admin_sessions (userId → users.id, CASCADE)
  └── chat_messages (senderId → users.id, CASCADE)

categories ─────┐
  └── products  │ (category → categories.id, RESTRICT)

products ───────┐
  ├── cart      │ (productId → products.id, CASCADE)
  ├── order_items (productId → products.id, RESTRICT)
  ├── reviews   │ (productId → products.id, CASCADE)
  └── chat_messages (productId → products.id, CASCADE)

orders ─────────┐
  └── order_items (orderId → orders.id, CASCADE)

settings (key-value, JSONB value)
```

---

## 📄 License

Private project. All rights reserved.

---

<p align="center">
  Made with ❤️ in Bangladesh 🇧🇩
</p>
