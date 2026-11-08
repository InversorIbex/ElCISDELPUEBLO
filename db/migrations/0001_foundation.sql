-- Cimientos de referencia. PostgreSQL 15+. No habilita recogida de opiniones.
-- No aplicado en Hito 1: requiere instancia de PostgreSQL y prueba de integración.
BEGIN;
CREATE SCHEMA IF NOT EXISTS reference;
CREATE SCHEMA IF NOT EXISTS catalog;
REVOKE ALL ON SCHEMA reference, catalog FROM PUBLIC;
CREATE TABLE reference.autonomous_communities (
  code char(2) PRIMARY KEY CHECK (code ~ '^[0-9]{2}$'),
  official_name text NOT NULL CHECK (length(trim(official_name)) > 0)
);
CREATE TABLE reference.provinces (
  code char(2) PRIMARY KEY CHECK (code ~ '^[0-9]{2}$'),
  community_code char(2) NOT NULL REFERENCES reference.autonomous_communities(code),
  official_name text NOT NULL,
  UNIQUE (code, community_code)
);
CREATE TABLE reference.municipalities (
  ine_code char(5) PRIMARY KEY CHECK (ine_code ~ '^[0-9]{5}$'),
  province_code char(2) NOT NULL REFERENCES reference.provinces(code),
  official_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  source_version text NOT NULL,
  CHECK (left(ine_code, 2) = province_code)
);
CREATE INDEX municipality_province_idx ON reference.municipalities(province_code);
CREATE TABLE catalog.source_documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url text NOT NULL CHECK (url LIKE 'https://%'),
  fetched_at timestamptz NOT NULL,
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  license_note text NOT NULL
);
CREATE TABLE catalog.elections (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  election_date date,
  official_source_id bigint REFERENCES catalog.source_documents(id),
  verified_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','open','closed','archived')),
  CHECK (status NOT IN ('open','closed','archived') OR (official_source_id IS NOT NULL AND verified_at IS NOT NULL AND election_date IS NOT NULL))
);
-- Sin políticas permisivas: acceso solo propietario hasta roles/migraciones posteriores.
ALTER TABLE reference.autonomous_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.elections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA reference, catalog FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA reference, catalog FROM PUBLIC;
COMMIT;
