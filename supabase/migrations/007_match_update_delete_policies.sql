-- Allow match creators to update/delete their matches (not only group hosts)
CREATE POLICY "Creators can update their matches" ON matches FOR UPDATE USING (
  created_by_user_id = auth.uid()
);

CREATE POLICY "Hosts can delete matches" ON matches FOR DELETE USING (
  is_group_host_or_cohost(group_id, auth.uid())
);

CREATE POLICY "Creators can delete their matches" ON matches FOR DELETE USING (
  created_by_user_id = auth.uid()
);
