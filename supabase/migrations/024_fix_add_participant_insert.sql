-- Fix add_participant_to_match: COUNT(*) left FOUND=true so new players never INSERTed.

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
