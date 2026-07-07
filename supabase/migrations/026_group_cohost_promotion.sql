-- Group host can promote players to co-host (max 5 hosts + co-hosts combined).

CREATE OR REPLACE FUNCTION is_group_host(
  p_group_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'ACTIVE'
      AND role = 'HOST'
  );
$$;

GRANT EXECUTE ON FUNCTION is_group_host(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION promote_member_to_cohost(p_membership_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership group_memberships;
  v_leadership_count INTEGER;
BEGIN
  SELECT * INTO v_membership FROM group_memberships WHERE id = p_membership_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_membership.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Member is not active';
  END IF;

  IF NOT is_group_host(v_membership.group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the group host can promote co-hosts';
  END IF;

  IF v_membership.role <> 'PLAYER' THEN
    RAISE EXCEPTION 'Only regular players can be promoted to co-host';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_leadership_count
  FROM group_memberships
  WHERE group_id = v_membership.group_id
    AND status = 'ACTIVE'
    AND role IN ('HOST', 'CO_HOST');

  IF v_leadership_count >= 5 THEN
    RAISE EXCEPTION 'This group already has the maximum of 5 hosts and co-hosts';
  END IF;

  UPDATE group_memberships
  SET role = 'CO_HOST', updated_at = NOW()
  WHERE id = p_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION promote_member_to_cohost(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION demote_cohost_to_player(p_membership_id UUID)
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

  IF v_membership.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Member is not active';
  END IF;

  IF NOT is_group_host(v_membership.group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the group host can change co-host roles';
  END IF;

  IF v_membership.role <> 'CO_HOST' THEN
    RAISE EXCEPTION 'Only co-hosts can be demoted to player';
  END IF;

  UPDATE group_memberships
  SET role = 'PLAYER', updated_at = NOW()
  WHERE id = p_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION demote_cohost_to_player(UUID) TO authenticated;
