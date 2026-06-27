-- Auto-promote earliest standby when a confirmed player drops out.
-- Player-initiated drop out runs as the dropping user, who cannot UPDATE another
-- member's participation row under RLS ("Users can update own participation" only).
-- Host updates worked; this RPC makes promotion reliable for everyone.

CREATE OR REPLACE FUNCTION promote_earliest_standby_for_match(p_match_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_standby_id UUID;
  v_max_players INTEGER;
  v_confirmed INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT user_can_access_match(p_match_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT max_players INTO v_max_players FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_confirmed
  FROM match_participations
  WHERE match_id = p_match_id
    AND status = 'CONFIRMED';

  IF v_confirmed >= v_max_players THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_standby_id
  FROM match_participations
  WHERE match_id = p_match_id
    AND status = 'STANDBY'
  ORDER BY joined_at ASC
  LIMIT 1;

  IF v_standby_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE match_participations
  SET status = 'CONFIRMED', dropped_out_at = NULL
  WHERE id = v_standby_id;

  RETURN v_standby_id;
END;
$$;

GRANT EXECUTE ON FUNCTION promote_earliest_standby_for_match(UUID) TO authenticated;
