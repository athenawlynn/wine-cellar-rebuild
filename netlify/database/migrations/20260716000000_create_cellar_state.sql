CREATE TABLE cellar_state (
  state_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
