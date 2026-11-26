-- Votación «¿Quién ganó el debate?» (debate a cuatro, 26-N de 2026).
--
-- * Solo se guardan contadores por opción: ni IP, ni cookie, ni hora del voto
--   junto a la opción elegida.
-- * Límite por navegador: 1 voto por credencial anónima (HMAC).
-- * Límite por IP: ventana deslizante con HMAC(secreto, IP), purgada al vencer.
-- * Idempotente: la API la aplica también al arrancar si aún no existe.
-- * Ninguna tabla es accesible para anon/authenticated (Data API de Supabase).
BEGIN;
CREATE SCHEMA IF NOT EXISTS poll_private;
REVOKE ALL ON SCHEMA poll_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS poll_private.debate_counts (
  debate_id text NOT NULL,
  option_id text NOT NULL CHECK (option_id IN ('sanchez','feijoo','abascal','colau','ninguno')),
  n bigint NOT NULL CHECK (n >= 0),
  PRIMARY KEY (debate_id, option_id)
);

CREATE TABLE IF NOT EXISTS poll_private.debate_browser (
  debate_id text NOT NULL,
  browser_digest char(64) NOT NULL CHECK (browser_digest ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY (debate_id, browser_digest)
);

CREATE TABLE IF NOT EXISTS poll_private.debate_ip_window (
  debate_id text NOT NULL,
  ip_digest char(64) NOT NULL CHECK (ip_digest ~ '^[a-f0-9]{64}$'),
  hit_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debate_ip_window_digest_idx ON poll_private.debate_ip_window (debate_id, ip_digest, hit_at);

CREATE TABLE IF NOT EXISTS poll_private.debate_idempotency (
  debate_id text NOT NULL,
  request_digest char(64) NOT NULL CHECK (request_digest ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY (debate_id, request_digest)
);

ALTER TABLE poll_private.debate_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.debate_browser ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.debate_ip_window ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.debate_idempotency ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON poll_private.debate_counts, poll_private.debate_browser,
  poll_private.debate_ip_window, poll_private.debate_idempotency FROM PUBLIC;
COMMIT;
