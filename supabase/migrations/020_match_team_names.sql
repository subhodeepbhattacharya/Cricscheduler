-- Custom display names for Team A / Team B on a match (optional; null = default label).

ALTER TABLE matches
  ADD COLUMN team_a_name TEXT,
  ADD COLUMN team_b_name TEXT;

ALTER TABLE matches
  ADD CONSTRAINT matches_team_a_name_length CHECK (
    team_a_name IS NULL OR char_length(trim(team_a_name)) BETWEEN 1 AND 40
  ),
  ADD CONSTRAINT matches_team_b_name_length CHECK (
    team_b_name IS NULL OR char_length(trim(team_b_name)) BETWEEN 1 AND 40
  );
