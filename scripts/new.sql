-- ═══════════════════════════════════════════════════════════════
-- BanglaBazar — Incremental SQL Updates (v3)
-- Date: 2025-06-24
-- ═══════════════════════════════════════════════════════════════

-- 1. Add deliveryCharge column to products table
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "deliveryCharge" DECIMAL(10,2);

-- 2. Add delivery charge setting to settings table (global default)
INSERT INTO "settings" ("key", "value", "updatedAt")
VALUES ('delivery_charge', '{"default": 60, "cod": 60, "bkash": 0, "nagad": 0}', NOW())
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updatedAt" = NOW();
