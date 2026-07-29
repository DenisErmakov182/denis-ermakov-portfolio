CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  case_name TEXT,
  page_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at);
