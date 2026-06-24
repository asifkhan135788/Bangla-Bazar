-- ═══════════════════════════════════════════════════════════════
-- BanglaBazar — Incremental SQL Updates (v5)
-- Date: 2025-06-24
-- Run AFTER all previous SQL scripts (new.sql, new2.sql)
-- ═══════════════════════════════════════════════════════════════

-- This migration adds NO new columns.
-- The profile address field already exists as "users"."address" (TEXT).
-- Profile edit now saves structured address as JSON:
--   {"zilla":"Dhaka","upazila":"Mirpur","gram":"Rupnagar","home":"12/3A"}
-- Old plain-text addresses will still work as fallback.

-- ─────────────────────────────────────────────────────────────
-- 1. Update existing agent_numbers settings to include default format
-- ─────────────────────────────────────────────────────────────
INSERT INTO "settings" ("key", "value", "updatedAt")
VALUES ('agent_numbers', '[]'::jsonb, NOW())
ON CONFLICT ("key") DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Done! No schema changes needed in this migration.
-- Profile address is stored as JSON in the existing "address" column.
-- ═══════════════════════════════════════════════════════════════
