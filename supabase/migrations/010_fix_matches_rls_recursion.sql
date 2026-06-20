-- Break infinite recursion between matches <-> match_participations RLS policies.
-- The original "Members can read group matches" policy queried match_participations,
-- while participations policies queried matches — causing a loop on any matches access.

DROP POLICY IF EXISTS "Members can read group matches" ON matches;

CREATE OR REPLACE FUNCTION user_can_access_match(
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
        OR EXISTS (
          SELECT 1
          FROM group_memberships gm
          WHERE gm.group_id = m.group_id
            AND gm.user_id = p_user_id
            AND gm.status = 'ACTIVE'
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION user_can_access_match(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION is_host_or_cohost_for_match(
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
      AND is_group_host_or_cohost(m.group_id, p_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION is_host_or_cohost_for_match(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_confirmed_count_for_match(p_match_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM match_participations
  WHERE match_id = p_match_id
    AND status = 'CONFIRMED';
$$;

GRANT EXECUTE ON FUNCTION get_confirmed_count_for_match(UUID) TO authenticated;

DROP POLICY IF EXISTS "Users can read participations for accessible matches" ON match_participations;
CREATE POLICY "Users can read participations for accessible matches" ON match_participations FOR SELECT USING (
  user_id = auth.uid()
  OR user_can_access_match(match_id, auth.uid())
);

DROP POLICY IF EXISTS "Hosts can update participations" ON match_participations;
CREATE POLICY "Hosts can update participations" ON match_participations FOR UPDATE USING (
  is_host_or_cohost_for_match(match_id, auth.uid())
);

-- Re-deploy update_match_for_user with confirmed-player validation (safe if 009 already ran).
CREATE OR REPLACE FUNCTION update_match_for_user(
  p_match_id UUID,
  p_title TEXT,
  p_date DATE,
  p_start_time TIME,
  p_location_name TEXT,
  p_location_address TEXT,
  p_google_maps_link TEXT,
  p_max_players INTEGER,
  p_fee_per_player NUMERIC,
  p_prepayment_required BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match matches;
  v_confirmed INTEGER;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status <> 'SCHEDULED' THEN
    RAISE EXCEPTION 'Only scheduled matches can be edited';
  END IF;

  IF v_match.created_by_user_id <> auth.uid()
     AND NOT is_group_host_or_cohost(v_match.group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_confirmed
  FROM match_participations
  WHERE match_id = p_match_id
    AND status = 'CONFIRMED';

  IF p_max_players < v_confirmed THEN
    RAISE EXCEPTION 'Max players cannot be less than confirmed players (%)', v_confirmed;
  END IF;

  UPDATE matches
  SET
    title = p_title,
    date = p_date,
    start_time = p_start_time,
    end_time = p_start_time,
    location_name = p_location_name,
    location_address = p_location_address,
    google_maps_link = NULLIF(TRIM(p_google_maps_link), ''),
    max_players = p_max_players,
    fee_per_player = p_fee_per_player,
    prepayment_required = p_prepayment_required
  WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_match_for_user(
  UUID, TEXT, DATE, TIME, TEXT, TEXT, TEXT, INTEGER, NUMERIC, BOOLEAN
) TO authenticated;
