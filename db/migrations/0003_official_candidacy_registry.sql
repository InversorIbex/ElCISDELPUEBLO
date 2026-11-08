-- Catálogo electoral público. No abre campañas ni crea registros de opiniones.
BEGIN;
CREATE TABLE catalog.candidacy_registry_editions (
 id text PRIMARY KEY,
 election_date date NOT NULL,
 reviewed_as_of date NOT NULL,
 proclaimed_source_url text NOT NULL CHECK (proclaimed_source_url LIKE 'https://www.boe.es/%'),
 proclaimed_sha256 char(64) NOT NULL CHECK (proclaimed_sha256 ~ '^[a-f0-9]{64}$'),
 correction_source_url text NOT NULL CHECK (correction_source_url LIKE 'https://www.boe.es/%'),
 correction_sha256 char(64) NOT NULL CHECK (correction_sha256 ~ '^[a-f0-9]{64}$')
);
CREATE TABLE catalog.registered_congress_candidacies (
 edition_id text NOT NULL REFERENCES catalog.candidacy_registry_editions(id),
 id uuid NOT NULL,
 province_code char(2) NOT NULL REFERENCES reference.provinces(code),
 proclamation_order integer NOT NULL CHECK (proclamation_order > 0),
 official_name text NOT NULL,
 status text NOT NULL CHECK (status='proclaimed'),
 source_paragraph integer NOT NULL CHECK (source_paragraph >= 0),
 correction_applied boolean NOT NULL,
 PRIMARY KEY(edition_id,id),
 UNIQUE(edition_id,province_code,proclamation_order)
);
CREATE INDEX congress_registry_province_idx ON catalog.registered_congress_candidacies(edition_id,province_code);
ALTER TABLE catalog.candidacy_registry_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.registered_congress_candidacies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON catalog.candidacy_registry_editions, catalog.registered_congress_candidacies FROM PUBLIC;
COMMIT;
