-- Allow any active group member to create matches (not only host/co-host).

DROP POLICY IF EXISTS "Hosts can create matches" ON matches;

CREATE POLICY "Members can create matches" ON matches FOR INSERT WITH CHECK (
  is_active_group_member(group_id, auth.uid())
  AND auth.uid() = created_by_user_id
);
