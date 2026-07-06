-- Host UPI VPA per match (set when prepayment is required).

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS host_upi_vpa TEXT;

COMMENT ON COLUMN matches.host_upi_vpa IS
  'Host UPI ID (VPA) for prepayment; required when prepayment_required is true.';

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
  p_prepayment_required BOOLEAN,
  p_host_upi_vpa TEXT
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
    prepayment_required = p_prepayment_required,
    host_upi_vpa = CASE
      WHEN p_prepayment_required THEN NULLIF(TRIM(p_host_upi_vpa), '')
      ELSE NULL
    END
  WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_match_for_user(
  UUID, TEXT, DATE, TIME, TEXT, TEXT, TEXT, INTEGER, NUMERIC, BOOLEAN, TEXT
) TO authenticated;

NOTIFY pgrst, 'reload schema';
