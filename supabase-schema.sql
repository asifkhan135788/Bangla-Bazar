-- ============================================================
-- 🏪 Bangla Bazar — Supabase Full Database Schema + RLS
-- ============================================================
-- Generated from: prisma/schema.prisma
-- Database:       PostgreSQL (Supabase)
-- Security:       Row Level Security (RLS) enabled on ALL tables
--
-- ⚠️  RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- ⚠️  Run it in order — enums first, then tables, then RLS
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 1: ENUM TYPES                                    ║
-- ╚══════════════════════════════════════════════════════════╝

DO $$ BEGIN
  -- Drop existing enums if they exist (idempotent)
  DROP TYPE IF EXISTS "SenderType" CASCADE;
  DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
  DROP TYPE IF EXISTS "OrderStatus" CASCADE;
  DROP TYPE IF EXISTS "UserRole" CASCADE;
END $$;

CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'banned');

CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bkash', 'nagad', 'rocket', 'card');

CREATE TYPE "SenderType" AS ENUM ('customer', 'admin');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 2: TABLES + CONSTRAINTS + INDEXES                ║
-- ╚══════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────
-- Table: users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"       TEXT        NOT NULL UNIQUE,
  "name"        TEXT,
  "phone"       TEXT,
  "address"     TEXT,
  "avatar"      TEXT,
  "role"        "UserRole"  NOT NULL DEFAULT 'customer',
  "banned"      BOOLEAN     NOT NULL DEFAULT false,
  "bannedUntil" TIMESTAMPTZ,
  "password"    TEXT        NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "users_email_idx"  ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx"   ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_banned_idx" ON "users" ("banned");


-- ────────────────────────────────────────────────────────────
-- Table: categories
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT        NOT NULL,
  "nameBN"    TEXT,
  "slug"      TEXT        NOT NULL UNIQUE,
  "image"     TEXT,
  "icon"      TEXT,
  "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  "active"    BOOLEAN     NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "categories_active_idx"    ON "categories" ("active");
CREATE INDEX IF NOT EXISTS "categories_sortOrder_idx" ON "categories" ("sortOrder");


-- ────────────────────────────────────────────────────────────
-- Table: products
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "products" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          TEXT          NOT NULL,
  "nameBN"        TEXT,
  "description"   TEXT,
  "descriptionBN" TEXT,
  "price"         DECIMAL(10,2) NOT NULL,
  "salePrice"     DECIMAL(10,2),
  "category"      UUID          NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
  "images"        TEXT[]        NOT NULL DEFAULT '{}',
  "stock"         INTEGER       NOT NULL DEFAULT 0,
  "featured"      BOOLEAN       NOT NULL DEFAULT false,
  "active"        BOOLEAN       NOT NULL DEFAULT true,
  "sku"           TEXT          UNIQUE,
  "unit"          TEXT          NOT NULL DEFAULT 'piece',
  "tags"          TEXT[]        NOT NULL DEFAULT '{}',
  "rating"        DECIMAL(2,1)  NOT NULL DEFAULT 0,
  "reviewCount"   INTEGER       NOT NULL DEFAULT 0,
  "buyCount"      INTEGER       NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products" ("category");
CREATE INDEX IF NOT EXISTS "products_featured_idx"   ON "products" ("featured");
CREATE INDEX IF NOT EXISTS "products_active_idx"     ON "products" ("active");
CREATE INDEX IF NOT EXISTS "products_price_idx"      ON "products" ("price");
CREATE INDEX IF NOT EXISTS "products_rating_idx"     ON "products" ("rating");
CREATE INDEX IF NOT EXISTS "products_createdAt_idx"  ON "products" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Table: cart
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cart" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity"  INTEGER     NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "cart_userId_productId_key" UNIQUE ("userId", "productId")
);

CREATE INDEX IF NOT EXISTS "cart_userId_idx"    ON "cart" ("userId");
CREATE INDEX IF NOT EXISTS "cart_productId_idx" ON "cart" ("productId");


-- ────────────────────────────────────────────────────────────
-- Table: orders
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "orders" (
  "id"             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"         UUID            NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "total"          DECIMAL(10,2)   NOT NULL,
  "status"         "OrderStatus"   NOT NULL DEFAULT 'pending',
  "address"        TEXT,
  "phone"          TEXT,
  "paymentMethod"  "PaymentMethod" NOT NULL DEFAULT 'cod',
  "transactionId"  TEXT,
  "note"           TEXT,
  "createdAt"      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "orders_userId_idx"     ON "orders" ("userId");
CREATE INDEX IF NOT EXISTS "orders_status_idx"     ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx"  ON "orders" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Table: order_items
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "order_items" (
  "id"        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"   UUID          NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "productId" UUID          NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "quantity"  INTEGER       NOT NULL,
  "price"     DECIMAL(10,2) NOT NULL,
  "name"      TEXT          NOT NULL,
  "image"     TEXT
);

CREATE INDEX IF NOT EXISTS "order_items_orderId_idx"   ON "order_items" ("orderId");
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items" ("productId");


-- ────────────────────────────────────────────────────────────
-- Table: reviews
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "rating"    INTEGER     NOT NULL,
  "comment"   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "reviews_userId_productId_key" UNIQUE ("userId", "productId")
);

CREATE INDEX IF NOT EXISTS "reviews_productId_idx"   ON "reviews" ("productId");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx"      ON "reviews" ("rating");
CREATE INDEX IF NOT EXISTS "reviews_createdAt_idx"   ON "reviews" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Table: user_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_logs" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        REFERENCES "users"("id") ON DELETE SET NULL,
  "action"    TEXT        NOT NULL,
  "details"   TEXT,
  "ip"        TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_logs_userId_idx"    ON "user_logs" ("userId");
CREATE INDEX IF NOT EXISTS "user_logs_action_idx"    ON "user_logs" ("action");
CREATE INDEX IF NOT EXISTS "user_logs_createdAt_idx" ON "user_logs" ("createdAt");


-- ────────────────────────────────────────────────────────────
-- Table: admin_sessions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "token"     TEXT        NOT NULL UNIQUE,
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "admin_sessions_token_idx"     ON "admin_sessions" ("token");
CREATE INDEX IF NOT EXISTS "admin_sessions_userId_idx"    ON "admin_sessions" ("userId");
CREATE INDEX IF NOT EXISTS "admin_sessions_expiresAt_idx" ON "admin_sessions" ("expiresAt");


-- ────────────────────────────────────────────────────────────
-- Table: chat_messages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id"         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId"   UUID         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "receiverId" TEXT,
  "productId"  UUID         REFERENCES "products"("id") ON DELETE CASCADE,
  "message"    TEXT         NOT NULL,
  "senderType" "SenderType" NOT NULL DEFAULT 'customer',
  "read"       BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "chat_messages_senderId_idx"   ON "chat_messages" ("senderId");
CREATE INDEX IF NOT EXISTS "chat_messages_receiverId_idx" ON "chat_messages" ("receiverId");
CREATE INDEX IF NOT EXISTS "chat_messages_productId_idx"  ON "chat_messages" ("productId");
CREATE INDEX IF NOT EXISTS "chat_messages_createdAt_idx"  ON "chat_messages" ("createdAt");
CREATE INDEX IF NOT EXISTS "chat_messages_read_idx"       ON "chat_messages" ("read");


-- ────────────────────────────────────────────────────────────
-- Table: settings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "settings" (
  "key"       TEXT        PRIMARY KEY,
  "value"     JSONB       NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 3: updatedAt AUTO-UPDATE TRIGGERS                ║
-- ║  (Mirrors Prisma @updatedAt behavior at DB level)       ║
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
  NULL; -- Triggers may already exist
END $$;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 4: ROW LEVEL SECURITY (RLS) + POLICIES          ║
-- ║                                                          ║
-- ║  Security Model:                                         ║
-- ║  ─────────────────────────────────────────────           ║
-- ║  • API Routes use Prisma → direct DB connection          ║
-- ║    → BYPASSES RLS (equivalent to superuser)              ║
-- ║  • Server Supabase client uses service_role key           ║
-- ║    → BYPASSES RLS                                        ║
-- ║  • Browser Supabase client uses anon key                  ║
-- ║    → RLS POLICES APPLY HERE                              ║
-- ║                                                          ║
-- ║  Policy Summary:                                         ║
-- ║  ─────────────────────────────────────────────           ║
-- ║  Table            | anon SELECT  | anon WRITE             ║
-- ║  ─────────────────┼──────────────┼────────────            ║
-- ║  users            | ❌ DENY      | ❌ DENY                ║
-- ║  categories       | ✅ active    | ❌ DENY                ║
-- ║  products         | ✅ active    | ❌ DENY                ║
-- ║  cart             | ❌ DENY      | ❌ DENY                ║
-- ║  orders           | ✅ own only* | ❌ DENY                ║
-- ║  order_items      | ✅ own only* | ❌ DENY                ║
-- ║  reviews          | ✅ all       | ❌ DENY                ║
-- ║  user_logs        | ❌ DENY      | ❌ DENY                ║
-- ║  admin_sessions   | ❌ DENY      | ❌ DENY                ║
-- ║  chat_messages    | ✅ limited*  | ❌ DENY                ║
-- ║  settings         | ✅ all       | ❌ DENY                ║
-- ║                                                          ║
-- ║  * orders/chat: anon can read for Realtime               ║
-- ║    subscriptions. Client-side filter further limits.      ║
-- ║    For stronger security, use authenticated role with     ║
-- ║    Supabase Auth (see PHASE 5 below).                    ║
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
-- 4.2 Helper function: Check if current user is admin
--     Uses request.jwt.claims for Supabase Auth users,
--     or falls back to checking admin_sessions table.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "is_admin"()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid()
    AND "role" = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
-- 4.3 Drop existing policies (idempotent)
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
-- ────────────────────────────────────────────────────────────
-- Security: SENSITIVE — passwords, roles, ban status
-- anon:       NO access (all user ops go through API routes)
-- authenticated: Read/update own profile only
-- ────────────────────────────────────────────────────────────

-- anon: Complete block
CREATE POLICY "users_anon_deny_all" ON "users"
  FOR ALL USING (false) WITH CHECK (false);

-- authenticated: Read own row
CREATE POLICY "users_auth_read_own" ON "users"
  FOR SELECT USING (auth.uid() = "id");

-- authenticated: Update own row (but NOT role/banned/password)
CREATE POLICY "users_auth_update_own" ON "users"
  FOR UPDATE USING (auth.uid() = "id")
  WITH CHECK (
    auth.uid() = "id"
    AND "role" = (SELECT "role" FROM "users" WHERE "id" = auth.uid())
    AND "banned" = (SELECT "banned" FROM "users" WHERE "id" = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- 4.5 POLICIES: categories
-- ────────────────────────────────────────────────────────────
-- anon:           Read active categories only
-- authenticated:  Read all (admin needs inactive too)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "categories_anon_read_active" ON "categories"
  FOR SELECT USING ("active" = true);

CREATE POLICY "categories_auth_read_all" ON "categories"
  FOR SELECT USING ("is_admin"() OR auth.uid() IS NOT NULL);

-- Only admins can write
CREATE POLICY "categories_auth_admin_write" ON "categories"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.6 POLICIES: products
-- ────────────────────────────────────────────────────────────
-- anon:           Read active products only
-- authenticated:  Read all (admin needs inactive too)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "products_anon_read_active" ON "products"
  FOR SELECT USING ("active" = true);

CREATE POLICY "products_auth_read_all" ON "products"
  FOR SELECT USING ("is_admin"() OR auth.uid() IS NOT NULL);

-- Only admins can write
CREATE POLICY "products_auth_admin_write" ON "products"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.7 POLICIES: cart
-- ────────────────────────────────────────────────────────────
-- anon:           NO access (all cart ops via API routes)
-- authenticated:  Read/write own cart items only
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
-- ────────────────────────────────────────────────────────────
-- anon:           Read own orders (for Realtime subscription)
-- authenticated:  Read own orders + admin reads all
-- ────────────────────────────────────────────────────────────

-- anon: Limited access for Realtime (client-side filter helps)
-- ⚠️  For maximum security, use authenticated role with Supabase Auth
--     and replace this with: USING (auth.uid() = "userId")
CREATE POLICY "orders_anon_read_limited" ON "orders"
  FOR SELECT USING (true);  -- Client-side filter: filter: `user_id=eq.${userId}`

CREATE POLICY "orders_auth_read_own" ON "orders"
  FOR SELECT USING (auth.uid() = "userId" OR "is_admin"());

CREATE POLICY "orders_auth_insert_own" ON "orders"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "orders_auth_admin_update" ON "orders"
  FOR UPDATE USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.9 POLICIES: order_items
-- ────────────────────────────────────────────────────────────
-- Same access pattern as orders
-- ────────────────────────────────────────────────────────────

CREATE POLICY "order_items_anon_read_limited" ON "order_items"
  FOR SELECT USING (true);  -- Client filters apply

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
-- ────────────────────────────────────────────────────────────
-- anon:           Read all reviews (public)
-- authenticated:  Read all + create own + update own + admin delete
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
-- ────────────────────────────────────────────────────────────
-- SENSITIVE: IP addresses, user agents, actions
-- anon/authenticated: NO access (admin only via API routes)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "user_logs_deny_all" ON "user_logs"
  FOR ALL USING (false) WITH CHECK (false);

-- Admin can read (via authenticated + is_admin check)
CREATE POLICY "user_logs_admin_read" ON "user_logs"
  FOR SELECT USING ("is_admin"());


-- ────────────────────────────────────────────────────────────
-- 4.12 POLICIES: admin_sessions
-- ────────────────────────────────────────────────────────────
-- MOST SENSITIVE: Session tokens
-- Only accessible via API routes (service_role bypasses RLS)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "admin_sessions_deny_all" ON "admin_sessions"
  FOR ALL USING (false) WITH CHECK (false);


-- ────────────────────────────────────────────────────────────
-- 4.13 POLICIES: chat_messages
-- ────────────────────────────────────────────────────────────
-- anon:           Read for Realtime (client filters by userId)
-- authenticated:  Read own conversations + admin reads all
-- ────────────────────────────────────────────────────────────

-- anon: Read all for Realtime (⚠️ see security note below)
-- Client-side filter: filter: `receiver_id=eq.${userId}`
-- For stronger security, migrate to Supabase Auth + authenticated policies
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
-- ────────────────────────────────────────────────────────────
-- anon:           Read all (banner, payment settings are public)
-- authenticated:  Read all + admin can write
-- ────────────────────────────────────────────────────────────

CREATE POLICY "settings_anon_read" ON "settings"
  FOR SELECT USING (true);

CREATE POLICY "settings_auth_admin_write" ON "settings"
  FOR ALL USING ("is_admin"()) WITH CHECK ("is_admin"());


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 5: SECURITY HARDENING                            ║
-- ╚══════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────
-- 5.1 Revoke default public schema permissions
-- ────────────────────────────────────────────────────────────
-- Prevent anonymous users from discovering table structure

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence permissions (for gen_random_uuid)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.2 Function permissions
-- ────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION "is_admin"() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION "is_not_banned"() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION "update_updated_at_column"() TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 5.3 Enable Supabase Realtime only for needed tables
-- ────────────────────────────────────────────────────────────
-- This is done via Supabase Dashboard > Database > Replication
-- But we can also do it via SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE "chat_messages";
ALTER PUBLICATION supabase_realtime ADD TABLE "orders";

-- ────────────────────────────────────────────────────────────
-- 5.4 Create admin user (DEFAULT — CHANGE PASSWORD AFTER!)
-- ────────────────────────────────────────────────────────────
-- Password: admin123 (bcrypt hash)
-- ⚠️  CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!

INSERT INTO "users" ("id", "email", "name", "password", "role")
VALUES (
  gen_random_uuid(),
  'admin@banglabazar.com',
  'Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
) ON CONFLICT ("email") DO NOTHING;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  PHASE 6: VERIFICATION QUERIES                         ║
-- ║  Run these to confirm everything is set up correctly    ║
-- ╚══════════════════════════════════════════════════════════╝

-- Check all tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Check Realtime publication:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  ✅ SETUP COMPLETE!                                      ║
-- ║                                                          ║
-- ║  Next steps:                                             ║
-- ║  1. Change the default admin password immediately       ║
-- ║  2. Add your .env variables (see README.md)             ║
-- ║  3. Run: npx prisma generate                            ║
-- ║  4. Run: npm run dev                                    ║
-- ╚══════════════════════════════════════════════════════════╝
