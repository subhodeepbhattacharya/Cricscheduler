-- Fetch upcoming matches for a group, bypassing RLS read issues.
-- Still enforces that the caller is an active member (or match creator).

CREATE OR REPLACE FUNCTION get_group_upcoming_matches(
  p_group_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF matches
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.*
  FROM matches m
  WHERE m.group_id = p_group_id
    AND m.status = 'SCHEDULED'
    AND m.date >= p_from_date
    AND (
      m.created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM group_memberships gm
        WHERE gm.group_id = p_group_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'ACTIVE'
      )
    )
  ORDER BY m.date ASC, m.start_time ASC;
$$;

GRANT EXECUTE ON FUNCTION get_group_upcoming_matches(UUID, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION get_match_for_user(p_match_id UUID)
RETURNS matches
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.*
  FROM matches m
  WHERE m.id = p_match_id
    AND (
      m.created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM group_memberships gm
        WHERE gm.group_id = m.group_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'ACTIVE'
      )
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_match_for_user(UUID) TO authenticated;

-- Direct RLS fallback (non-recursive) for normal queries
DROP POLICY IF EXISTS "Users can read matches in joined groups" ON matches;
CREATE POLICY "Users can read matches in joined groups" ON matches FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM group_memberships gm
    WHERE gm.group_id = matches.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'ACTIVE'
  )
);
