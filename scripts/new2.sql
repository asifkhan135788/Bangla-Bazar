-- ═══════════════════════════════════════════════════════════════
-- BanglaBazar — Incremental SQL Updates (v4)
-- Date: 2025-06-24
-- Run AFTER all previous SQL scripts
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Add deliveryCharge column to products table
--    (for per-product delivery charge from admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "deliveryCharge" DECIMAL(10,2);

-- ─────────────────────────────────────────────────────────────
-- 2. Fix chat_messages.receiverId type: TEXT → UUID
--    Prisma schema uses @db.Uuid but original SQL created it as TEXT
-- ─────────────────────────────────────────────────────────────
-- Step 2a: First set NULL values to actual UUIDs or remove orphan rows
-- (Only if there are non-UUID values in receiverId)
-- UPDATE "chat_messages" SET "receiverId" = NULL WHERE "receiverId" IS NOT NULL AND "receiverId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2b: Alter column type from TEXT to UUID
-- NOTE: Run this ONLY if all existing receiverId values are valid UUIDs or NULL
-- If you have non-UUID data, run Step 2a first!
DO $$
BEGIN
  -- Check if receiverId is TEXT type, then alter to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages'
    AND column_name = 'receiverId'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE "chat_messages" ALTER COLUMN "receiverId" TYPE UUID USING "receiverId"::UUID;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Fix products.category → products.categoryId
--    Prisma uses "categoryId" but original SQL used "category"
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Check if column "category" exists (old name) and "categoryId" doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE "products" RENAME COLUMN "category" TO "categoryId";
    -- Update index name too
    DROP INDEX IF EXISTS "products_categoryId_idx";
    CREATE INDEX "products_categoryId_idx" ON "products" ("categoryId");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Seed default payment settings rows
--    (bKash number, Nagad number, COD delivery charge)
--    These are used by /api/settings/payment and admin Settings page
-- ─────────────────────────────────────────────────────────────
INSERT INTO "settings" ("key", "value", "updatedAt")
VALUES ('bkash_number', '"0171-0000000"'::jsonb, NOW())
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();

INSERT INTO "settings" ("key", "value", "updatedAt")
VALUES ('nagad_number', '"0181-0000000"'::jsonb, NOW())
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();

INSERT INTO "settings" ("key", "value", "updatedAt")
VALUES ('cod_delivery_charge', '60'::jsonb, NOW())
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();

-- ─────────────────────────────────────────────────────────────
-- Done! Run this script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
