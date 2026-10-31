CREATE TABLE feedback (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 category TEXT NOT NULL,
 message TEXT NOT NULL,
 nickname TEXT NOT NULL DEFAULT '',
 game_version TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new',
 ip_key TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX feedback_status_seq ON feedback (status, seq DESC);
--> statement-breakpoint
CREATE INDEX feedback_rate ON feedback (ip_key, created_at);
