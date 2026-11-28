-- Porras apuntadas para la clasificación del 29-N (apodo, porra y HMAC del navegador).
-- No se publican antes de las 21:00 del 29-N. La API la crea también al arrancar si no existe.
BEGIN;
CREATE SCHEMA IF NOT EXISTS poll_private;
REVOKE ALL ON SCHEMA poll_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS poll_private.porra_entries (
  porra_id text NOT NULL,
  browser_digest char(64) NOT NULL CHECK (browser_digest ~ '^[a-f0-9]{64}$'),
  alias text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 24),
  code text NOT NULL CHECK (char_length(code) <= 300),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (porra_id, browser_digest)
);

CREATE UNIQUE INDEX IF NOT EXISTS porra_entries_alias_idx ON poll_private.porra_entries (porra_id, lower(alias));

CREATE TABLE IF NOT EXISTS poll_private.porra_ip_window (
  porra_id text NOT NULL,
  ip_digest char(64) NOT NULL CHECK (ip_digest ~ '^[a-f0-9]{64}$'),
  hit_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS porra_ip_window_digest_idx ON poll_private.porra_ip_window (porra_id, ip_digest, hit_at);

ALTER TABLE poll_private.porra_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.porra_ip_window ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON poll_private.porra_entries, poll_private.porra_ip_window FROM PUBLIC;
COMMIT;
