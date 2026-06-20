-- Allow users to read their own memberships (needed for /groups list and avoids RLS gaps).
CREATE POLICY "Users can read own memberships" ON group_memberships FOR SELECT USING (
  user_id = auth.uid()
);
