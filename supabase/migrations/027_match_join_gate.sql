-- Match link join gate: lets signed-in non-members see group name + invite flow
-- instead of a 404 when opening /matches/{id}.

CREATE OR REPLACE FUNCTION get_match_join_context(p_match_id UUID)
RETURNS TABLE (
  match_title TEXT,
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  whatsapp_group_link TEXT,
  invite_token TEXT,
  membership_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.title,
    g.id,
    g.name,
    g.description,
    g.whatsapp_group_link,
    g.invite_token,
    gm.status::text
  FROM matches m
  JOIN cricket_groups g ON g.id = m.group_id
  LEFT JOIN group_memberships gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
  WHERE m.id = p_match_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_match_join_context(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
