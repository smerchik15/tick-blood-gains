CREATE TABLE scores (
 id TEXT PRIMARY KEY NOT NULL,
 nickname TEXT NOT NULL,
 score INTEGER NOT NULL,
 difficulty TEXT NOT NULL,
 mode TEXT NOT NULL,
 elapsed INTEGER NOT NULL,
 kills INTEGER NOT NULL,
 bosses INTEGER NOT NULL,
 counts_json TEXT NOT NULL,
 ip_key TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX scores_rank ON scores (difficulty, mode, score DESC);
--> statement-breakpoint
CREATE INDEX scores_rate ON scores (ip_key, created_at);
