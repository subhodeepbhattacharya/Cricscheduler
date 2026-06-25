-- Phone/OTP auth: phone-first, email optional.
--
-- Users now sign up via phone OTP (WhatsApp/SMS), so email is no longer
-- required and phone becomes the primary identifier.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
  ON users(phone)
  WHERE phone IS NOT NULL;

-- Pending join requests now expose phone instead of email (return type changed,
-- so the function must be dropped and recreated).
DROP FUNCTION IF EXISTS get_pending_join_requests(UUID);

CREATE FUNCTION get_pending_join_requests(p_group_id UUID)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  name TEXT,
  phone TEXT,
  requested_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.id, u.id, u.name, u.phone, gm.created_at
  FROM group_memberships gm
  JOIN users u ON u.id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND gm.status::text = 'PENDING'
    AND is_group_host_or_cohost(p_group_id, auth.uid())
  ORDER BY gm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_pending_join_requests(UUID) TO authenticated;
