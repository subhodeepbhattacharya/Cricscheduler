-- Pending join requests: show requester phone even when public.users.phone is missing.
-- Falls back to auth.users.phone (OTP sign-in stores it there first).

-- Backfill profiles created before the phone trigger stored phone on signup.
UPDATE public.users u
SET phone = CASE
  WHEN au.phone IS NULL OR au.phone = '' THEN NULL
  WHEN left(au.phone, 1) = '+' THEN au.phone
  ELSE '+' || au.phone
END
FROM auth.users au
WHERE u.id = au.id
  AND (u.phone IS NULL OR u.phone = '')
  AND au.phone IS NOT NULL
  AND au.phone <> '';

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
  SELECT
    gm.id,
    u.id,
    u.name,
    COALESCE(
      NULLIF(u.phone, ''),
      CASE
        WHEN au.phone IS NULL OR au.phone = '' THEN NULL
        WHEN left(au.phone, 1) = '+' THEN au.phone
        ELSE '+' || au.phone
      END
    ),
    gm.created_at
  FROM group_memberships gm
  JOIN users u ON u.id = gm.user_id
  JOIN auth.users au ON au.id = u.id
  WHERE gm.group_id = p_group_id
    AND gm.status::text = 'PENDING'
    AND is_group_host_or_cohost(p_group_id, auth.uid())
  ORDER BY gm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_pending_join_requests(UUID) TO authenticated;
