-- ═══════════════════════════════════════════════════════════════════════════
-- BanglaBazar Incremental SQL Updates
-- Run AFTER the original supabase.sql
-- This file contains ONLY new/modified objects — it does NOT drop or recreate
-- existing tables, functions, or policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Agent Numbers setting (new row in settings table)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO settings (key, value)
VALUES (
  'agent_numbers',
  '[]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Additional index on chat_messages for conversation listing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx
  ON chat_messages (sender_id, receiver_id, created_at DESC);

-- Composite index for efficient "mark as read" updates
CREATE INDEX IF NOT EXISTS chat_messages_unread_idx
  ON chat_messages (receiver_id, read)
  WHERE read = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Additional user_logs indexes for IP and user agent lookups
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS user_logs_ip_idx
  ON user_logs (ip);

CREATE INDEX IF NOT EXISTS user_logs_user_agent_idx
  ON user_logs (user_agent);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Function: get_or_create_admin_chat
-- Returns the admin user ID for customer support chat
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE role = 'admin' LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Function: get_user_conversations
-- Returns a list of conversation partners with last message info
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_messages AS (
    SELECT
      CASE
        WHEN sender_id = p_user_id THEN receiver_id
        ELSE sender_id
      END AS other_user_id,
      message,
      created_at,
      read,
      sender_id,
      ROW_NUMBER() OVER (
        PARTITION BY CASE
          WHEN sender_id = p_user_id THEN receiver_id
          ELSE sender_id
        END
        ORDER BY created_at DESC
      ) AS rn
    FROM chat_messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
  )
  SELECT
    rm.other_user_id,
    COALESCE(u.name, 'User') AS other_user_name,
    u.avatar AS other_user_avatar,
    rm.message AS last_message,
    rm.created_at AS last_message_time,
    (
      SELECT COUNT(*)
      FROM chat_messages cm
      WHERE cm.sender_id = rm.other_user_id
        AND cm.receiver_id = p_user_id
        AND cm.read = false
    ) AS unread_count
  FROM ranked_messages rm
  LEFT JOIN users u ON u.id = rm.other_user_id
  WHERE rm.rn = 1
  ORDER BY rm.created_at DESC;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Function: mark_messages_read
-- Marks all messages from a specific sender as read
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_sender_id UUID,
  p_receiver_id UUID
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE chat_messages
  SET read = true
  WHERE sender_id = p_sender_id
    AND receiver_id = p_receiver_id
    AND read = false;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS policies for new functions (if not already present)
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow authenticated users to read their own conversations
CREATE POLICY "Users can view their own conversations"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Allow authenticated users to insert messages where they are the sender
CREATE POLICY "Users can send messages as themselves"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Allow authenticated users to update read status of messages they received
CREATE POLICY "Users can mark their received messages as read"
  ON chat_messages FOR UPDATE
  USING (
    auth.uid() = receiver_id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Grant execute on new functions to authenticated users
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_admin_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Enable Realtime for chat_messages table (if not already enabled)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Additional RLS for settings table (allow public read for payment settings)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Public can read payment settings"
  ON settings FOR SELECT
  USING (
    key IN ('bkash_number', 'nagad_number', 'cod_delivery_charge', 'agent_numbers')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! All incremental updates applied.
-- ═══════════════════════════════════════════════════════════════════════════
