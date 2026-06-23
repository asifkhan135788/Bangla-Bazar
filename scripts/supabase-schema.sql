-- ============================================================
-- Supabase SQL Schema — Auto-generated from Prisma schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- Step 1: Create custom ENUM types
-- (PostgreSQL enums, used instead of text check constraints)

CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'banned');

CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bkash', 'nagad', 'rocket', 'card');

CREATE TYPE "SenderType" AS ENUM ('customer', 'admin');

-- ============================================================
-- Step 2: Create tables
-- ============================================================

-- -----------------------------------------------------------
-- Table: users
-- -----------------------------------------------------------
CREATE TABLE "users" (
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

CREATE INDEX "users_email_idx"   ON "users" ("email");
CREATE INDEX "users_role_idx"    ON "users" ("role");
CREATE INDEX "users_banned_idx"  ON "users" ("banned");

-- -----------------------------------------------------------
-- Table: categories
-- -----------------------------------------------------------
CREATE TABLE "categories" (
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

CREATE INDEX "categories_active_idx"    ON "categories" ("active");
CREATE INDEX "categories_sortOrder_idx" ON "categories" ("sortOrder");

-- -----------------------------------------------------------
-- Table: products
-- -----------------------------------------------------------
CREATE TABLE "products" (
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

CREATE INDEX "products_categoryId_idx" ON "products" ("category");
CREATE INDEX "products_featured_idx"   ON "products" ("featured");
CREATE INDEX "products_active_idx"     ON "products" ("active");
CREATE INDEX "products_price_idx"      ON "products" ("price");
CREATE INDEX "products_rating_idx"     ON "products" ("rating");
CREATE INDEX "products_createdAt_idx"  ON "products" ("createdAt");

-- -----------------------------------------------------------
-- Table: cart
-- -----------------------------------------------------------
CREATE TABLE "cart" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity"  INTEGER     NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "cart_userId_productId_key" UNIQUE ("userId", "productId")
);

CREATE INDEX "cart_userId_idx"    ON "cart" ("userId");
CREATE INDEX "cart_productId_idx" ON "cart" ("productId");

-- -----------------------------------------------------------
-- Table: orders
-- -----------------------------------------------------------
CREATE TABLE "orders" (
  "id"             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"         UUID           NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "total"          DECIMAL(10,2)  NOT NULL,
  "status"         "OrderStatus"  NOT NULL DEFAULT 'pending',
  "address"        TEXT,
  "phone"          TEXT,
  "paymentMethod"  "PaymentMethod" NOT NULL DEFAULT 'cod',
  "transactionId"  TEXT,
  "note"           TEXT,
  "createdAt"      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX "orders_userId_idx"     ON "orders" ("userId");
CREATE INDEX "orders_status_idx"     ON "orders" ("status");
CREATE INDEX "orders_createdAt_idx"  ON "orders" ("createdAt");

-- -----------------------------------------------------------
-- Table: order_items
-- -----------------------------------------------------------
CREATE TABLE "order_items" (
  "id"        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"   UUID          NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "productId" UUID          NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "quantity"  INTEGER       NOT NULL,
  "price"     DECIMAL(10,2) NOT NULL,
  "name"      TEXT          NOT NULL,
  "image"     TEXT
);

CREATE INDEX "order_items_orderId_idx"   ON "order_items" ("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items" ("productId");

-- -----------------------------------------------------------
-- Table: reviews
-- -----------------------------------------------------------
CREATE TABLE "reviews" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "productId" UUID        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "rating"    INTEGER     NOT NULL,
  "comment"   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "reviews_userId_productId_key" UNIQUE ("userId", "productId")
);

CREATE INDEX "reviews_productId_idx"   ON "reviews" ("productId");
CREATE INDEX "reviews_rating_idx"      ON "reviews" ("rating");
CREATE INDEX "reviews_createdAt_idx"   ON "reviews" ("createdAt");

-- -----------------------------------------------------------
-- Table: user_logs
-- -----------------------------------------------------------
CREATE TABLE "user_logs" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        REFERENCES "users"("id") ON DELETE SET NULL,
  "action"    TEXT        NOT NULL,
  "details"   TEXT,
  "ip"        TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "user_logs_userId_idx"    ON "user_logs" ("userId");
CREATE INDEX "user_logs_action_idx"    ON "user_logs" ("action");
CREATE INDEX "user_logs_createdAt_idx" ON "user_logs" ("createdAt");

-- -----------------------------------------------------------
-- Table: admin_sessions
-- -----------------------------------------------------------
CREATE TABLE "admin_sessions" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "token"     TEXT        NOT NULL UNIQUE,
  "userId"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "admin_sessions_token_idx"     ON "admin_sessions" ("token");
CREATE INDEX "admin_sessions_userId_idx"    ON "admin_sessions" ("userId");
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions" ("expiresAt");

-- -----------------------------------------------------------
-- Table: chat_messages
-- -----------------------------------------------------------
CREATE TABLE "chat_messages" (
  "id"         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId"   UUID         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "receiverId" TEXT,
  "productId"  UUID         REFERENCES "products"("id") ON DELETE CASCADE,
  "message"    TEXT         NOT NULL,
  "senderType" "SenderType" NOT NULL DEFAULT 'customer',
  "read"       BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX "chat_messages_senderId_idx"   ON "chat_messages" ("senderId");
CREATE INDEX "chat_messages_receiverId_idx" ON "chat_messages" ("receiverId");
CREATE INDEX "chat_messages_productId_idx"  ON "chat_messages" ("productId");
CREATE INDEX "chat_messages_createdAt_idx"  ON "chat_messages" ("createdAt");
CREATE INDEX "chat_messages_read_idx"       ON "chat_messages" ("read");

-- -----------------------------------------------------------
-- Table: settings
-- -----------------------------------------------------------
CREATE TABLE "settings" (
  "key"       TEXT        PRIMARY KEY,
  "value"     JSONB       NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Step 3: updatedAt auto-update triggers
-- (Prisma @updatedAt is handled client-side, but for direct SQL
--  inserts/updates we add triggers to keep them in sync)
-- ============================================================

CREATE OR REPLACE FUNCTION "update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to every table that has an "updatedAt" column
CREATE TRIGGER "users_updated_at"         BEFORE UPDATE ON "users"         FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
CREATE TRIGGER "categories_updated_at"    BEFORE UPDATE ON "categories"    FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
CREATE TRIGGER "products_updated_at"      BEFORE UPDATE ON "products"     FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
CREATE TRIGGER "cart_updated_at"          BEFORE UPDATE ON "cart"          FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
CREATE TRIGGER "orders_updated_at"        BEFORE UPDATE ON "orders"        FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();
CREATE TRIGGER "settings_updated_at"      BEFORE UPDATE ON "settings"     FOR EACH ROW EXECUTE FUNCTION "update_updated_at_column"();

-- ============================================================
-- Step 4: Enable RLS (Row Level Security) — recommended for Supabase
-- ============================================================
-- Uncomment the lines below if you want RLS enabled on all tables.
-- You will then need to write RLS policies for each table.

-- ALTER TABLE "users"          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "categories"     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "products"       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "cart"           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "orders"         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "order_items"    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "reviews"        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "user_logs"      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "admin_sessions" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "chat_messages"  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "settings"       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Done! All tables, indexes, constraints, and triggers created.
-- ============================================================
