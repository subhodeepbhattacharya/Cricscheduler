-- Allow a group HOST (or the creator) to delete their group.
-- Deleting a group cascades to memberships, matches, participations and payments
-- via the ON DELETE CASCADE foreign keys defined in 001_initial_schema.sql.

CREATE POLICY "Hosts can delete groups" ON cricket_groups FOR DELETE USING (
  created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = cricket_groups.id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
      AND role = 'HOST'
  )
);

CREATE OR REPLACE FUNCTION delete_group_for_user(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group cricket_groups;
BEGIN
  SELECT * INTO v_group FROM cricket_groups WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF v_group.created_by_user_id <> auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM group_memberships
       WHERE group_id = p_group_id
         AND user_id = auth.uid()
         AND status = 'ACTIVE'
         AND role = 'HOST'
     ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM cricket_groups WHERE id = p_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_group_for_user(UUID) TO authenticated;
