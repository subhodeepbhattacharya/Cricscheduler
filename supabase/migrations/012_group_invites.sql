-- Group invite links + join requests with host approval.

-- 1. New membership status for pending join requests.
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'PENDING';

-- 2. Stable, regenerable invite token per group.
ALTER TABLE cricket_groups
  ADD COLUMN IF NOT EXISTS invite_token TEXT;

UPDATE cricket_groups
SET invite_token = replace(gen_random_uuid()::text, '-', '')
WHERE invite_token IS NULL;

ALTER TABLE cricket_groups
  ALTER COLUMN invite_token SET DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ALTER COLUMN invite_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cricket_groups_invite_token
  ON cricket_groups(invite_token);

-- 3. Public-ish lookup of a group by its invite token (for the join page).
--    Returns only non-sensitive fields and never the token of other groups.
CREATE OR REPLACE FUNCTION get_group_by_invite_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  whatsapp_group_link TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.description, g.whatsapp_group_link
  FROM cricket_groups g
  WHERE g.invite_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_group_by_invite_token(TEXT) TO authenticated;

-- 4. Request to join a group via invite token. Creates a PENDING membership.
--    Returns the resulting status: 'ACTIVE' (already a member), 'PENDING',
--    'REQUESTED' (newly created), or 'BANNED'.
CREATE OR REPLACE FUNCTION request_to_join_group(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_existing group_memberships;
BEGIN
  SELECT id INTO v_group_id FROM cricket_groups WHERE invite_token = p_token;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite link';
  END IF;

  SELECT * INTO v_existing
  FROM group_memberships
  WHERE group_id = v_group_id AND user_id = auth.uid();

  IF FOUND THEN
    IF v_existing.status = 'ACTIVE' THEN
      RETURN 'ACTIVE';
    ELSIF v_existing.status = 'PENDING' THEN
      RETURN 'PENDING';
    ELSIF v_existing.status = 'BANNED' THEN
      RAISE EXCEPTION 'You cannot join this group';
    ELSE
      -- Previously LEFT: re-request.
      UPDATE group_memberships
      SET status = 'PENDING', role = 'PLAYER', updated_at = NOW()
      WHERE id = v_existing.id;
      RETURN 'REQUESTED';
    END IF;
  END IF;

  INSERT INTO group_memberships (group_id, user_id, role, status)
  VALUES (v_group_id, auth.uid(), 'PLAYER', 'PENDING');

  RETURN 'REQUESTED';
END;
$$;

GRANT EXECUTE ON FUNCTION request_to_join_group(TEXT) TO authenticated;

-- 5. Host: list pending join requests (with requester name/email).
CREATE OR REPLACE FUNCTION get_pending_join_requests(p_group_id UUID)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  requested_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.id, u.id, u.name, u.email, gm.created_at
  FROM group_memberships gm
  JOIN users u ON u.id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND gm.status::text = 'PENDING'
    AND is_group_host_or_cohost(p_group_id, auth.uid())
  ORDER BY gm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_pending_join_requests(UUID) TO authenticated;

-- 6. Host: approve a pending membership.
CREATE OR REPLACE FUNCTION approve_join_request(p_membership_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  SELECT group_id INTO v_group_id FROM group_memberships WHERE id = p_membership_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF NOT is_group_host_or_cohost(v_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE group_memberships
  SET status = 'ACTIVE', updated_at = NOW()
  WHERE id = p_membership_id AND status = 'PENDING';
END;
$$;

GRANT EXECUTE ON FUNCTION approve_join_request(UUID) TO authenticated;

-- 7. Host: deny (delete) a pending membership so the user may re-request later.
CREATE OR REPLACE FUNCTION deny_join_request(p_membership_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  SELECT group_id INTO v_group_id FROM group_memberships WHERE id = p_membership_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF NOT is_group_host_or_cohost(v_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM group_memberships
  WHERE id = p_membership_id AND status = 'PENDING';
END;
$$;

GRANT EXECUTE ON FUNCTION deny_join_request(UUID) TO authenticated;

-- 8. Host/creator: regenerate the invite token (revokes the old link).
CREATE OR REPLACE FUNCTION regenerate_group_invite(p_group_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF NOT is_group_host_or_cohost(p_group_id, auth.uid())
     AND NOT EXISTS (
       SELECT 1 FROM cricket_groups
       WHERE id = p_group_id AND created_by_user_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '');

  UPDATE cricket_groups
  SET invite_token = v_token, updated_at = NOW()
  WHERE id = p_group_id;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION regenerate_group_invite(UUID) TO authenticated;
