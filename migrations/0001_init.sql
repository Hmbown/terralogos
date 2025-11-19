-- D1 schema for Terra-Logos telemetry snapshots
CREATE TABLE IF NOT EXISTS metric_cache (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metric_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_time TEXT NOT NULL,
    payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metric_history_time
    ON metric_history(snapshot_time DESC);
