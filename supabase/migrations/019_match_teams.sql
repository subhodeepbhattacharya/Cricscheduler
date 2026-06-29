-- Optional Team A / Team B assignment for confirmed participants (host-managed).

ALTER TABLE match_participations
  ADD COLUMN team TEXT CHECK (team IS NULL OR team IN ('A', 'B'));

CREATE INDEX idx_match_participations_team
  ON match_participations(match_id, team)
  WHERE team IS NOT NULL;
