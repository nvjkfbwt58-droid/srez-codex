-- Initial schema, equivalent to the existing bootstrap in server/store.ts.
-- No historical ALTER migrations or migration-version table exist yet.
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS records (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  brand TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY(kind,id)
);
CREATE TABLE IF NOT EXISTS idempotency (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  hash TEXT NOT NULL,
  job TEXT NOT NULL,
  PRIMARY KEY(scope,key)
);
