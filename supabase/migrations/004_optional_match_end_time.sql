-- End time is optional for matches
ALTER TABLE matches ALTER COLUMN end_time DROP NOT NULL;
