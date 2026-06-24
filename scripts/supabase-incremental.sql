-- ═══════════════════════════════════════════════════════════════════════════
-- BanglaBazar Incremental SQL Updates  (v2 — fixed)
-- Run AFTER the original supabase.sql
-- Only adds NEW objects that don't exist yet.
--
-- ⚠️  Column names are quoted camelCase: "senderId", "receiverId", etc.
--     because Prisma does NOT use @map on most columns.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Agent Numbers setting row
--    (table already exists from supabase.sql, just adding a new row)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "settings" ("key", "value")
VALUES ('agent_numbers', '[]'::jsonb)
ON CONFLICT ("key") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Extra composite indexes on chat_messages for conversation listing
--    (single-column indexes already exist from supabase.sql lines 286-294)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "chat_messages_conversation_idx"
  ON "chat_messages" ("senderId", "receiverId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "chat_messages_unread_idx"
  ON "chat_messages" ("receiverId", "read")
  WHERE read = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Extra indexes on user_logs for IP / user-agent lookups
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "user_logs_ip_idx"
  ON "user_logs" ("ip");

CREATE INDEX IF NOT EXISTS "user_logs_userAgent_idx"
  ON "user_logs" ("userAgent");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Helper function: get_admin_user_id()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM "users" WHERE role = 'admin' LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Helper function: get_user_conversations()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id  UUID,
  other_user_name  TEXT,
  other_user_avatar TEXT,
  last_message     TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count     BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_messages AS (
    SELECT
      CASE
        WHEN "senderId" = p_user_id THEN "receiverId"
        ELSE "senderId"
      END AS other_user_id,
      message,
      "createdAt",
      read,
      "senderId",
      ROW_NUMBER() OVER (
        PARTITION BY CASE
          WHEN "senderId" = p_user_id THEN "receiverId"
          ELSE "senderId"
        END
        ORDER BY "createdAt" DESC
      ) AS rn
    FROM "chat_messages"
    WHERE "senderId" = p_user_id OR "receiverId" = p_user_id
  )
  SELECT
    rm.other_user_id,
    COALESCE(u.name, 'User')  AS other_user_name,
    u.avatar                   AS other_user_avatar,
    rm.message                 AS last_message,
    rm."createdAt"             AS last_message_time,
    (SELECT COUNT(*) FROM "chat_messages" cm
       WHERE cm."senderId" = rm.other_user_id
         AND cm."receiverId" = p_user_id
         AND cm.read = false)  AS unread_count
  FROM ranked_messages rm
  LEFT JOIN "users" u ON u.id = rm.other_user_id
  WHERE rm.rn = 1
  ORDER BY rm."createdAt" DESC;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Helper function: mark_messages_read()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_sender_id   UUID,
  p_receiver_id UUID
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE "chat_messages"
  SET read = true
  WHERE "senderId"   = p_sender_id
    AND "receiverId" = p_receiver_id
    AND read = false;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Grants for the new functions
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_admin_user_id()            TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID)   TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Done!
--
-- What we did NOT repeat (already in supabase.sql):
--   ❌ ALTER PUBLICATION supabase_realtime ADD TABLE "chat_messages"  (line 860)
--   ❌ ALTER PUBLICATION supabase_realtime ADD TABLE "orders"          (line 861)
--   ❌ chat_messages RLS policies                                      (lines 658-702)
--   ❌ settings RLS policies                                           (lines 711-716)
-- ═══════════════════════════════════════════════════════════════════════════
