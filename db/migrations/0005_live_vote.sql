-- Votación ciudadana en producción (Supabase, región UE).
-- Sustituye al borrador db/drafts/public_vote.sql.
--
-- * Votos: circunscripción + candidatura proclamada + día. Sin IP, sin cookie,
--   sin hora exacta y sin relación con los contadores antifraude.
-- * Límite por IP: 2 votos en cualquier ventana de 5 horas (deslizante). Se
--   guarda solo HMAC(secreto, IP) y la hora del voto, en una tabla separada
--   que se purga al vencer la ventana.
-- * Límite por navegador: 1 voto por credencial anónima en toda la campaña.
-- * `simulated = true`: votos del modo demostración. Se cuentan aparte, la web
--   los anuncia siempre y se pueden borrar sin tocar los reales.
-- * Ninguna tabla es accesible para anon/authenticated (Data API de Supabase).
BEGIN;
CREATE SCHEMA IF NOT EXISTS poll_private;
REVOKE ALL ON SCHEMA poll_private FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE 'REVOKE ALL ON SCHEMA poll_private FROM anon'; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE 'REVOKE ALL ON SCHEMA poll_private FROM authenticated'; END IF;
END $$;

-- Una candidatura pertenece a una única circunscripción (los id son UUID v5 estables).
CREATE UNIQUE INDEX IF NOT EXISTS registry_id_province_unique
  ON catalog.registered_congress_candidacies(id, province_code);

CREATE TABLE poll_private.ballots (
  id uuid PRIMARY KEY,
  campaign_id text NOT NULL CHECK (campaign_id = 'congress-2026'),
  province_code char(2) NOT NULL REFERENCES reference.provinces(code),
  candidacy_id uuid NOT NULL,
  consent_version text NOT NULL CHECK (consent_version = 'epov-2026-v1'),
  simulated boolean NOT NULL DEFAULT false,
  cast_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Madrid')::date,
  FOREIGN KEY (candidacy_id, province_code)
    REFERENCES catalog.registered_congress_candidacies(id, province_code)
);
CREATE INDEX ballots_province_idx ON poll_private.ballots (campaign_id, province_code, candidacy_id);

-- Contadores mantenidos en la misma transacción que el voto: leer resultados
-- nunca recorre la tabla de votos.
CREATE TABLE poll_private.counts (
  campaign_id text NOT NULL,
  province_code char(2) NOT NULL REFERENCES reference.provinces(code),
  candidacy_id uuid NOT NULL,
  simulated boolean NOT NULL,
  n bigint NOT NULL CHECK (n >= 0),
  PRIMARY KEY (campaign_id, province_code, candidacy_id, simulated)
);

CREATE TABLE poll_private.ip_window (
  campaign_id text NOT NULL,
  ip_digest char(64) NOT NULL CHECK (ip_digest ~ '^[a-f0-9]{64}$'),
  hit_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ip_window_digest_idx ON poll_private.ip_window (campaign_id, ip_digest, hit_at);
CREATE INDEX ip_window_expiry_idx ON poll_private.ip_window (hit_at);

CREATE TABLE poll_private.browser_lifetime (
  campaign_id text NOT NULL,
  browser_digest char(64) NOT NULL CHECK (browser_digest ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY (campaign_id, browser_digest)
);

CREATE TABLE poll_private.idempotency (
  campaign_id text NOT NULL,
  request_digest char(64) NOT NULL CHECK (request_digest ~ '^[a-f0-9]{64}$'),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, request_digest)
);

DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='poll_private' LOOP
    EXECUTE format('ALTER TABLE poll_private.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON poll_private.%I FROM PUBLIC', t.tablename);
  END LOOP;
END $$;
COMMIT;
