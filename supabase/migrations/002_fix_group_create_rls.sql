-- Fix: allow creators to read groups immediately after insert (before membership exists).
-- Without this, insert().select() fails because RETURNING is subject to SELECT policies.

CREATE POLICY "Creators can read their groups" ON cricket_groups FOR SELECT USING (
  created_by_user_id = auth.uid()
);

-- Fix: allow users to create their own profile if the signup trigger did not run
-- (e.g. user signed up before migration was applied).
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (
  auth.uid() = id
);
