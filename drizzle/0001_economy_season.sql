ALTER TABLE scores ADD COLUMN season INTEGER NOT NULL DEFAULT 3;
--> statement-breakpoint
CREATE INDEX scores_season_rank ON scores (season, difficulty, mode, score DESC);
