-- Host, co-host, or match creator can add group members to a scheduled match.
-- RLS only allows users to insert their own participation row; this RPC bypasses that.

CREATE OR REPLACE FUNCTION can_manage_match_participants(
  p_match_id UUID,
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
    FROM matches m
    WHERE m.id = p_match_id
      AND (
        m.created_by_user_id = p_user_id
        OR is_group_host_or_cohost(m.group_id, p_user_id)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION can_manage_match_participants(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_match_add_candidates(p_match_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  phone TEXT,
  role membership_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
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
    gm.role
  FROM matches m
  JOIN group_memberships gm ON gm.group_id = m.group_id AND gm.status = 'ACTIVE'
  JOIN users u ON u.id = gm.user_id
  JOIN auth.users au ON au.id = u.id
  WHERE m.id = p_match_id
    AND m.status = 'SCHEDULED'
    AND can_manage_match_participants(p_match_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1
      FROM match_participations mp
      WHERE mp.match_id = p_match_id
        AND mp.user_id = gm.user_id
        AND mp.status IN ('CONFIRMED', 'STANDBY')
    )
  ORDER BY
    CASE gm.role
      WHEN 'HOST' THEN 0
      WHEN 'CO_HOST' THEN 1
      ELSE 2
    END,
    u.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_match_add_candidates(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION add_participant_to_match(
  p_match_id UUID,
  p_user_id UUID
)
RETURNS participation_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match matches;
  v_confirmed INTEGER;
  v_new_status participation_status;
  v_existing match_participations;
  v_has_existing BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status <> 'SCHEDULED' THEN
    RAISE EXCEPTION 'Only scheduled matches accept new players';
  END IF;

  IF NOT can_manage_match_participants(p_match_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_memberships gm
    WHERE gm.group_id = v_match.group_id
      AND gm.user_id = p_user_id
      AND gm.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'User is not an active member of this group';
  END IF;

  SELECT * INTO v_existing
  FROM match_participations
  WHERE match_id = p_match_id
    AND user_id = p_user_id;

  v_has_existing := FOUND;

  IF v_has_existing AND v_existing.status IN ('CONFIRMED', 'STANDBY') THEN
    RAISE EXCEPTION 'User is already on this match';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_confirmed
  FROM match_participations
  WHERE match_id = p_match_id
    AND status = 'CONFIRMED';

  IF v_confirmed < v_match.max_players THEN
    v_new_status := 'CONFIRMED';
  ELSE
    v_new_status := 'STANDBY';
  END IF;

  IF v_has_existing THEN
    UPDATE match_participations
    SET status = v_new_status,
        dropped_out_at = NULL,
        joined_at = NOW()
    WHERE id = v_existing.id;
  ELSE
    INSERT INTO match_participations (match_id, user_id, status)
    VALUES (p_match_id, p_user_id, v_new_status);
  END IF;

  RETURN v_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION add_participant_to_match(UUID, UUID) TO authenticated;

-- Match creators (not only host/co-host) can manage participations and payments on their matches.
DROP POLICY IF EXISTS "Hosts can update participations" ON match_participations;
CREATE POLICY "Managers can update participations" ON match_participations FOR UPDATE USING (
  is_host_or_cohost_for_match(match_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM matches m
    WHERE m.id = match_participations.match_id
      AND m.created_by_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Hosts can read match payments" ON payments;
CREATE POLICY "Managers can read match payments" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM matches m
    WHERE m.id = payments.match_id
      AND (
        m.created_by_user_id = auth.uid()
        OR is_group_host_or_cohost(m.group_id, auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "Hosts can update payments" ON payments;
CREATE POLICY "Managers can update payments" ON payments FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM matches m
    WHERE m.id = payments.match_id
      AND (
        m.created_by_user_id = auth.uid()
        OR is_group_host_or_cohost(m.group_id, auth.uid())
      )
  )
);
