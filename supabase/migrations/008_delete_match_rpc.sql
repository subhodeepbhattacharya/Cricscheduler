-- Delete a match as creator or group host/co-host (bypasses DELETE RLS issues).

CREATE OR REPLACE FUNCTION delete_match_for_user(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match matches;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status <> 'SCHEDULED' THEN
    RAISE EXCEPTION 'Only scheduled matches can be deleted';
  END IF;

  IF v_match.created_by_user_id <> auth.uid()
     AND NOT is_group_host_or_cohost(v_match.group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM matches WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_match_for_user(UUID) TO authenticated;
