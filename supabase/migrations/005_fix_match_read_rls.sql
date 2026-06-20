-- Allow match creators to read matches immediately after insert
CREATE POLICY "Creators can read their matches" ON matches FOR SELECT USING (
  created_by_user_id = auth.uid()
);
