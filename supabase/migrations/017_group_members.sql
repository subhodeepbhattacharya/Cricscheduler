-- List active group members (host/co-host only) and remove a member.

CREATE OR REPLACE FUNCTION get_group_members(p_group_id UUID)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  name TEXT,
  phone TEXT,
  role membership_role,
  joined_at TIMESTAMPTZ
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
        WHEN left(au.phone,  1) = '+' THEN au.phone
        ELSE '+' || au.phone
      END
    ),
    gm.role,
    gm.created_at
  FROM group_memberships gm
  JOIN users u ON u.id = gm.user_id
  JOIN auth.users au ON au.id = u.id
  WHERE gm.group_id = p_group_id
    AND gm.status = 'ACTIVE'
    AND is_group_host_or_cohost(p_group_id, auth.uid())
  ORDER BY
    CASE gm.role
      WHEN 'HOST' THEN 0
      WHEN 'CO_HOST' THEN 1
      ELSE 2
    END,
    u.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_group_members(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION remove_group_member(p_membership_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership group_memberships;
BEGIN
  SELECT * INTO v_membership FROM group_memberships WHERE id = p_membership_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF NOT is_group_host_or_cohost(v_membership.group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_membership.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Member is not active';
  END IF;

  IF v_membership.role = 'HOST' THEN
    RAISE EXCEPTION 'Cannot remove the group host';
  END IF;

  IF v_membership.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  UPDATE group_memberships
  SET status = 'LEFT', updated_at = NOW()
  WHERE id = p_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_group_member(UUID) TO authenticated;
