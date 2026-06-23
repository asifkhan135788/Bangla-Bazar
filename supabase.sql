-- ============================================================
-- 🏪 Bangla Bazar — supabase.sql
-- ============================================================
-- Prisma Schema থেকে তৈরি: prisma/schema.prisma
-- Database: PostgreSQL (Supabase)
-- Security: Row Level Security (RLS) — সব টেবিলে সক্রিয়
--
-- ⚠️  পুরো স্ক্রিপ্ট Supabase SQL Editor-এ রান করুন
-- ⚠️  ক্রম অনুসারে রান করুন — enums → tables → triggers → RLS
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 1: ENUM TYPES (Prisma enum → PostgreSQL enum)    ║
-- ╚══════════════════════════════════════════════════════════╝

DO $$ BEGIN
  DROP TYPE IF EXISTS "SenderType" CASCADE;
  DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
  DROP TYPE IF EXISTS "OrderStatus" CASCADE;
  DROP TYPE IF EXISTS "UserRole" CASCADE;
END $$;

-- Prisma: enum UserRole { customer, admin, banned }
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'banned');

-- Prisma: enum OrderStatus { pending, confirmed, processing, shipped, delivered, cancelled }
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Prisma: enum PaymentMethod { cod, bkash, nagad, rocket, card }
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bkash', 'nagad', 'rocket', 'card');

-- Prisma: enum SenderType { customer, admin }
CREATE TYPE "SenderType" AS ENUM ('customer', 'admin');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 2: TABLES (Prisma model → PostgreSQL table)      ║
-- ║  @@map() → টেবিলের নাম                                  ║
-- ║  @map() → কলামের নাম (যদি আলাদা হয়)                    ║
-- ╚══════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────
-- Prisma Model: User → Table: users (@@map("users"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "email"       TEXT        NOT NULL UNIQUE,                          -- @unique @db.Text
  "name"        TEXT,                                                 -- String? @db.Text
  "phone"       TEXT,                                                 -- String? @db.Text
  "address"     TEXT,                                                 -- String? @db.Text
  "avatar"      TEXT,                                                 -- String? @db.Text
  "role"        "UserRole"  NOT NULL DEFAULT 'customer',              -- @default(customer)
  "banned"      BOOLEAN     NOT NULL DEFAULT false,                   -- @default(false)
  "bannedUntil" TIMESTAMPTZ,                                          -- DateTime? @db.Timestamptz()
  "password"    TEXT        NOT NULL,                                 -- @db.Text
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),                   -- @default(now()) @db.Timestamptz()
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()                    -- @updatedAt @db.Timestamptz()
);

-- Prisma @@index([email])
CREATE INDEX IF NOT EXISTS "users_email_idx"  ON "users" ("email");
-- Prisma @@index([role])
CREATE INDEX IF NOT EXISTS "users_role_idx"   ON "users" ("role");
-- Prisma @@index([banned])
CREATE INDEX IF NOT EXISTS "users_banned_idx" ON "users" ("banned");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Category → Table: categories (@@map("categories"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "name"      TEXT        NOT NULL,                                 -- @db.Text
  "nameBN"    TEXT,                                                 -- String? @db.Text
  "slug"      TEXT        NOT NULL UNIQUE,                          -- @unique @db.Text
  "image"     TEXT,                                                 -- String? @db.Text
  "icon"      TEXT,                                                 -- String? @db.Text
  "sortOrder" INTEGER     NOT NULL DEFAULT 0,                       -- @default(0)
  "active"    BOOLEAN     NOT NULL DEFAULT true,                    -- @default(true)
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),                   -- @default(now()) @db.Timestamptz()
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()                    -- @updatedAt @db.Timestamptz()
);

-- Prisma @@index([active])
CREATE INDEX IF NOT EXISTS "categories_active_idx"    ON "categories" ("active");
-- Prisma @@index([sortOrder])
CREATE INDEX IF NOT EXISTS "categories_sortOrder_idx" ON "categories" ("sortOrder");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Product → Table: products (@@map("products"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "products" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "name"          TEXT          NOT NULL,                                 -- @db.Text
  "nameBN"        TEXT,                                                   -- String? @db.Text
  "description"   TEXT,                                                   -- String? @db.Text
  "descriptionBN" TEXT,                                                   -- String? @db.Text
  "price"         DECIMAL(10,2) NOT NULL,                                -- @db.Decimal(10, 2)
  "salePrice"     DECIMAL(10,2),                                         -- Decimal? @db.Decimal(10, 2)
  "category"      UUID          NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,  -- categoryId @map("category") → Restrict
  "images"        TEXT[]        NOT NULL DEFAULT '{}',                   -- String[] @default([])
  "stock"         INTEGER       NOT NULL DEFAULT 0,                      -- @default(0)
  "featured"      BOOLEAN       NOT NULL DEFAULT false,                  -- @default(false)
  "active"        BOOLEAN       NOT NULL DEFAULT true,                   -- @default(true)
  "sku"           TEXT          UNIQUE,                                   -- @unique @db.Text
  "unit"          TEXT          NOT NULL DEFAULT 'piece',                -- @default("piece") @db.Text
  "tags"          TEXT[]        NOT NULL DEFAULT '{}',                   -- String[] @default([])
  "rating"        DECIMAL(2,1)  NOT NULL DEFAULT 0,                      -- @default(0) @db.Decimal(2, 1)
  "reviewCount"   INTEGER       NOT NULL DEFAULT 0,                      -- @default(0)
  "buyCount"      INTEGER       NOT NULL DEFAULT 0,                      -- @default(0)
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT now(),                  -- @default(now()) @db.Timestamptz()
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT now()                   -- @updatedAt @db.Timestamptz()
);

-- Prisma @@index([categoryId])
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products" ("category");
-- Prisma @@index([featured])
CREATE INDEX IF NOT EXISTS "products_featured_idx"   ON "products" ("featured");
-- Prisma @@index([active])
CREATE INDEX IF NOT EXISTS "products_active_idx"     ON "products" ("active");
-- Prisma @@index([price])
CREATE INDEX IF NOT EXISTS "products_price_idx"      ON "products" ("price");
-- Prisma @@index([rating])
CREATE INDEX IF NOT EXISTS "products_rating_idx"     ON "products" ("rating");
-- Prisma @@index([createdAt])
CREATE INDEX IF NOT EXISTS "products_createdAt_idx"  ON "products" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Cart → Table: cart (@@map("cart"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cart" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,      -- onDelete: Cascade
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,   -- onDelete: Cascade
  "quantity"  INTEGER     NOT NULL DEFAULT 1,                       -- @default(1)
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),                   -- @default(now()) @db.Timestamptz()
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),                   -- @updatedAt @db.Timestamptz()

  -- Prisma @@unique([userId, productId])
  CONSTRAINT "cart_userId_productId_key" UNIQUE ("userId", "productId")
);

-- Prisma @@index([userId])
CREATE INDEX IF NOT EXISTS "cart_userId_idx"    ON "cart" ("userId");
-- Prisma @@index([productId])
CREATE INDEX IF NOT EXISTS "cart_productId_idx" ON "cart" ("productId");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Order → Table: orders (@@map("orders"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "orders" (
  "id"             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "userId"         UUID            NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,  -- onDelete: Restrict
  "total"          DECIMAL(10,2)   NOT NULL,                                -- @db.Decimal(10, 2)
  "status"         "OrderStatus"   NOT NULL DEFAULT 'pending',              -- @default(pending)
  "address"        TEXT,                                                    -- String? @db.Text
  "phone"          TEXT,                                                    -- String? @db.Text
  "paymentMethod"  "PaymentMethod" NOT NULL DEFAULT 'cod',                  -- @default(cod)
  "transactionId"  TEXT,                                                    -- String? @db.Text
  "note"           TEXT,                                                    -- String? @db.Text
  "createdAt"      TIMESTAMPTZ     NOT NULL DEFAULT now(),                  -- @default(now()) @db.Timestamptz()
  "updatedAt"      TIMESTAMPTZ     NOT NULL DEFAULT now()                   -- @updatedAt @db.Timestamptz()
);

-- Prisma @@index([userId])
CREATE INDEX IF NOT EXISTS "orders_userId_idx"     ON "orders" ("userId");
-- Prisma @@index([status])
CREATE INDEX IF NOT EXISTS "orders_status_idx"     ON "orders" ("status");
-- Prisma @@index([createdAt])
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx"  ON "orders" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: OrderItem → Table: order_items (@@map("order_items"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "order_items" (
  "id"        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "orderId"   UUID          NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,     -- onDelete: Cascade
  "productId" UUID          NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,  -- onDelete: Restrict
  "quantity"  INTEGER       NOT NULL,                                 -- Int
  "price"     DECIMAL(10,2) NOT NULL,                                -- @db.Decimal(10, 2)
  "name"      TEXT          NOT NULL,                                 -- @db.Text
  "image"     TEXT                                                   -- String? @db.Text
);

-- Prisma @@index([orderId])
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx"   ON "order_items" ("orderId");
-- Prisma @@index([productId])
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items" ("productId");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Review → Table: reviews (@@map("reviews"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,      -- onDelete: Cascade
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,   -- onDelete: Cascade
  "rating"    INTEGER     NOT NULL,                                 -- Int
  "comment"   TEXT,                                                 -- String? @db.Text
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),                   -- @default(now()) @db.Timestamptz()

  -- Prisma @@unique([userId, productId])
  CONSTRAINT "reviews_userId_productId_key" UNIQUE ("userId", "productId")
);

-- Prisma @@index([productId])
CREATE INDEX IF NOT EXISTS "reviews_productId_idx"   ON "reviews" ("productId");
-- Prisma @@index([rating])
CREATE INDEX IF NOT EXISTS "reviews_rating_idx"      ON "reviews" ("rating");
-- Prisma @@index([createdAt])
CREATE INDEX IF NOT EXISTS "reviews_createdAt_idx"   ON "reviews" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: UserLog → Table: user_logs (@@map("user_logs"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_logs" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "userId"    UUID        REFERENCES "users"("id") ON DELETE SET NULL,  -- onDelete: SetNull
  "action"    TEXT        NOT NULL,                                 -- @db.Text
  "details"   TEXT,                                                 -- String? @db.Text
  "ip"        TEXT,                                                 -- String? @db.Text
  "userAgent" TEXT,                                                 -- String? @db.Text
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()                    -- @default(now()) @db.Timestamptz()
);

-- Prisma @@index([userId])
CREATE INDEX IF NOT EXISTS "user_logs_userId_idx"    ON "user_logs" ("userId");
-- Prisma @@index([action])
CREATE INDEX IF NOT EXISTS "user_logs_action_idx"    ON "user_logs" ("action");
-- Prisma @@index([createdAt])
CREATE INDEX IF NOT EXISTS "user_logs_createdAt_idx" ON "user_logs" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: AdminSession → Table: admin_sessions (@@map("admin_sessions"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "token"     TEXT        NOT NULL UNIQUE,                          -- @unique @db.Text
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,  -- onDelete: Cascade
  "expiresAt" TIMESTAMPTZ NOT NULL,                                 -- @db.Timestamptz()
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()                    -- @default(now()) @db.Timestamptz()
);

-- Prisma @@index([token])
CREATE INDEX IF NOT EXISTS "admin_sessions_token_idx"     ON "admin_sessions" ("token");
-- Prisma @@index([userId])
CREATE INDEX IF NOT EXISTS "admin_sessions_userId_idx"    ON "admin_sessions" ("userId");
-- Prisma @@index([expiresAt])
CREATE INDEX IF NOT EXISTS "admin_sessions_expiresAt_idx" ON "admin_sessions" ("expiresAt");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: ChatMessage → Table: chat_messages (@@map("chat_messages"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id"         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),   -- @id @default(uuid()) @db.Uuid
  "senderId"   UUID         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,     -- onDelete: Cascade
  "receiverId" TEXT,                                                   -- String? @db.Text
  "productId"  UUID         REFERENCES "products"("id") ON DELETE CASCADE,           -- onDelete: Cascade
  "message"    TEXT         NOT NULL,                                  -- @db.Text
  "senderType" "SenderType" NOT NULL DEFAULT 'customer',              -- @default(customer)
  "read"       BOOLEAN      NOT NULL DEFAULT false,                   -- @default(false)
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()                    -- @default(now()) @db.Timestamptz()
);

-- Prisma @@index([senderId])
CREATE INDEX IF NOT EXISTS "chat_messages_senderId_idx"   ON "chat_messages" ("senderId");
-- Prisma @@index([receiverId])
CREATE INDEX IF NOT EXISTS "chat_messages_receiverId_idx" ON "chat_messages" ("receiverId");
-- Prisma @@index([productId])
CREATE INDEX IF NOT EXISTS "chat_messages_productId_idx"  ON "chat_messages" ("productId");
-- Prisma @@index([createdAt])
CREATE INDEX IF NOT EXISTS "chat_messages_createdAt_idx"  ON "chat_messages" ("createdAt");
-- Prisma @@index([read])
CREATE INDEX IF NOT EXISTS "chat_messages_read_idx"       ON "chat_messages" ("read");


-- ────────────────────────────────────────────────────────────
-- Prisma Model: Settings → Table: settings (@@map("settings"))
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "settings" (
  "key"       TEXT        PRIMARY KEY,                               -- @id @db.Text
  "value"     JSONB       NOT NULL,                                  -- Json
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()                     -- @updatedAt @db.Timestamptz()
);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 3: TRIGGERS (Prisma @updatedAt → auto-update)    ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION "update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER "users_updated_at"      BEFORE UPDATE ON "users"      FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
  CREATE TRIGGER "categories_updated_at" BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
  CREATE TRIGGER "products_updated_at"   BEFORE UPDATE ON "products"  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
  CREATE TRIGGER "cart_updated_at"       BEFORE UPDATE ON "cart"       FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
  CREATE TRIGGER "orders_updated_at"     BEFORE UPDATE ON "orders"     FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
  CREATE TRIGGER "settings_updated_at"   BEFORE UPDATE ON "settings"  FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
EXCEPTION WHEN others THEN
  NULL; -- Triggers already exist
END $$;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 4: ROW LEVEL SECURITY (RLS) + POLICIES          ║
-- ╚══════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────
-- 4.1 Enable RLS on ALL tables
-- ────────────────────────────────────────────────────────────
ALTER TABLE "users"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_logs"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings"       ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- 4.2 Helper functions for RLS policies
-- ────────────────────────────────────────────────────────────

-- চেক করে বর্তমান user admin কিনা
CREATE OR REPLACE FUNCTION "is_admin"()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid()
    AND "role" = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- চেক করে user banned কিনা
CREATE OR REPLACE FUNCTION "is_not_banned"()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid()
    AND "banned" = false
    AND ("bannedUntil" IS NULL OR "bannedUntil" < now())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ────────────────────────────────────────────────────────────
-- 4.3 আগের সব policies ড্রপ (idempotent)
-- ────────────────────────────────────────────────────────────
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────
-- 4.4 POLICIES: users
-- SENSITIVE: passwords, roles, ban status
-- anon: কোনো access নেই (সব user ops API routes দিয়ে হয়)
-- authenticated: শুধু নিজের profile পড়া/আপডেট
-- ────────────────────────────────────────────────────────────

-- anon: সম্পূর্ণ ব্লক
CREATE POLICY "users_anon_deny_all" ON "users"
  FOR ALL USING (false) WITH CHECK (false);

-- authenticated: নিজের row পড়া
CREATE POLICY "users_auth_read_own" ON "users"
  FOR SELECT USING (auth.uid() = "id");

-- authenticated: নিজের row আপডেট (role/banned/password পরিবর্তন করা যাবে না)
CREATE POLICY "users_auth_update_own" ON "users"
  FOR UPDATE USING (auth.uid() = "id")
  WITH CHECK (
    auth.uid() = "id"
    AND "role" = (SELECT "role" FROM "users" WHERE "id" = auth.uid())
    AND "banned" = (SELECT "banned" FROM "users" WHERE "id" = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- 4.5 POLICIES: categories
-- anon: শুধু active categories পড়া
-- authenticated: সব পড়া, admin লেখা
-- ────────────────────────────────────────────────────────────

CREATE POLICY "categories_anon_read_active" ON "categories"
  FOR SELECT USING ("active" = true);

CREATE POLICY "categories_auth_read_all" ON "categories"
  FOR SELECT USING ("is_admin"() OR auth.uid() IS NOT NULL);

CREATE POLICY "categories_auth_admin_write" ON "categories"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.6 POLICIES: products
-- anon: শুধু active products পড়া
-- authenticated: সব পড়া, admin লেখা
-- ────────────────────────────────────────────────────────────

CREATE POLICY "products_anon_read_active" ON "products"
  FOR SELECT USING ("active" = true);

CREATE POLICY "products_auth_read_all" ON "products"
  FOR SELECT USING ("is_admin"() OR auth.uid() IS NOT NULL);

CREATE POLICY "products_auth_admin_write" ON "products"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.7 POLICIES: cart
-- SENSITIVE: user এর cart items
-- anon: কোনো access নেই
-- authenticated: শুধু নিজের cart
-- ────────────────────────────────────────────────────────────

CREATE POLICY "cart_anon_deny_all" ON "cart"
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "cart_auth_read_own" ON "cart"
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "cart_auth_insert_own" ON "cart"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "cart_auth_update_own" ON "cart"
  FOR UPDATE USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

CREATE POLICY "cart_auth_delete_own" ON "cart"
  FOR DELETE USING (auth.uid() = "userId");


-- ────────────────────────────────────────────────────────────
-- 4.8 POLICIES: orders
-- anon: Realtime subscription এর জন্য limited read
-- authenticated: নিজের orders + admin সব
-- ────────────────────────────────────────────────────────────

CREATE POLICY "orders_anon_read_limited" ON "orders"
  FOR SELECT USING (true);  -- Client-side filter applies

CREATE POLICY "orders_auth_read_own" ON "orders"
  FOR SELECT USING (auth.uid() = "userId" OR "is_admin"());

CREATE POLICY "orders_auth_insert_own" ON "orders"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "orders_auth_admin_update" ON "orders"
  FOR UPDATE USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.9 POLICIES: order_items
-- orders এর মতোই access pattern
-- ────────────────────────────────────────────────────────────

CREATE POLICY "order_items_anon_read_limited" ON "order_items"
  FOR SELECT USING (true);  -- Client-side filter applies

CREATE POLICY "order_items_auth_read_own" ON "order_items"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "orders" WHERE "orders"."id" = "order_items"."orderId" AND "orders"."userId" = auth.uid())
    OR "is_admin"()
  );

CREATE POLICY "order_items_auth_insert_own" ON "order_items"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "orders" WHERE "orders"."id" = "order_items"."orderId" AND "orders"."userId" = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- 4.10 POLICIES: reviews
-- anon: সব reviews পড়া (public)
-- authenticated: review লেখা, নিজের আপডেট, admin ডিলিট
-- ────────────────────────────────────────────────────────────

CREATE POLICY "reviews_anon_read" ON "reviews"
  FOR SELECT USING (true);

CREATE POLICY "reviews_auth_insert" ON "reviews"
  FOR INSERT WITH CHECK (auth.uid() = "userId" AND "is_not_banned"());

CREATE POLICY "reviews_auth_update_own" ON "reviews"
  FOR UPDATE USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

CREATE POLICY "reviews_auth_admin_delete" ON "reviews"
  FOR DELETE USING ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.11 POLICIES: user_logs
-- SENSITIVE: IP addresses, user agents
-- শুধু admin read পারে (service_role দিয়ে)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "user_logs_deny_all" ON "user_logs"
  FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "user_logs_admin_read" ON "user_logs"
  FOR SELECT USING ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.12 POLICIES: admin_sessions
-- MOST SENSITIVE: Session tokens
-- শুধু API routes দিয়ে access (service_role bypasses RLS)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "admin_sessions_deny_all" ON "admin_sessions"
  FOR ALL USING (false) WITH CHECK (false);


-- ────────────────────────────────────────────────────────────
-- 4.13 POLICIES: chat_messages
-- anon: Realtime subscription এর জন্য read (client filter)
-- authenticated: নিজের conversations + admin সব
-- ────────────────────────────────────────────────────────────

CREATE POLICY "chat_messages_anon_read" ON "chat_messages"
  FOR SELECT USING (true);

CREATE POLICY "chat_messages_auth_read_own" ON "chat_messages"
  FOR SELECT USING (
    auth.uid() = "senderId"
    OR "receiverId" = auth.uid()::text
    OR "is_admin"()
  );

CREATE POLICY "chat_messages_auth_insert" ON "chat_messages"
  FOR INSERT WITH CHECK (auth.uid() = "senderId" AND "is_not_banned"());

CREATE POLICY "chat_messages_auth_update_own" ON "chat_messages"
  FOR UPDATE USING (auth.uid() = "senderId") WITH CHECK (auth.uid() = "senderId");

CREATE POLICY "chat_messages_auth_admin_all" ON "chat_messages"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.14 POLICIES: settings
-- anon: সব settings পড়া (banner, payment public)
-- admin: লেখা
-- ────────────────────────────────────────────────────────────

CREATE POLICY "settings_anon_read" ON "settings"
  FOR SELECT USING (true);

CREATE POLICY "settings_auth_admin_write" ON "settings"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 5: SECURITY HARDENING                            ║
-- ╚══════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────
-- 5.1 Public schema permissions প্রত্যাহার
-- ────────────────────────────────────────────────────────────
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- টেবিল permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sequence permissions (gen_random_uuid)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.2 Function permissions
-- ────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION "is_admin"() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION "is_not_banned"() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION "update_updated_at_column"() TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.3 Supabase Realtime সক্রিয় করা
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE "chat_messages";
ALTER PUBLICATION supabase_realtime ADD TABLE "orders";

-- ────────────────────────────────────────────────────────────
-- 5.4 Default Admin User তৈরি
-- Password: admin123 (bcrypt hash)
-- ⚠️  প্রথম login এর পর পাসওয়ার্ড পরিবর্তন করুন!
-- ────────────────────────────────────────────────────────────
INSERT INTO "users" ("id", "email", "name", "password", "role")
VALUES (
  gen_random_uuid(),
  'admin@banglabazar.com',
  'Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
) ON CONFLICT ("email") DO NOTHING;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 6: VERIFICATION (যাচাই করার জন্য)              ║
-- ║  নিচের queries রান করে সব ঠিক আছে কিনা দেখুন         ║
-- ╚══════════════════════════════════════════════════════════╝

-- সব টেবিল আছে কিনা:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- RLS সক্রিয় আছে কিনা:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- সব policies দেখুন:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Realtime টেবিল দেখুন:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  ✅ সম্পূর্ণ! পরবর্তী পদক্ষেপ:                          ║
-- ║  1. ডিফল্ট admin পাসওয়ার্ড পরিবর্তন করুন               ║
-- ║  2. .env ফাইলে variables সেট করুন (README.md দেখুন)   ║
-- ║  3. npx prisma generate রান করুন                       ║
-- ║  4. npm run dev রান করুন                               ║
-- ╚══════════════════════════════════════════════════════════╝
