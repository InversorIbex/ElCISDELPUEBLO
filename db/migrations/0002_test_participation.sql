-- Motor de laboratorio exclusivamente. La restricción is_test bloquea campañas reales.
BEGIN;
CREATE SCHEMA participation_private;
CREATE SCHEMA authorization_private;
CREATE SCHEMA aggregation_private;
CREATE SCHEMA publication;
REVOKE ALL ON SCHEMA participation_private, authorization_private, aggregation_private, publication FROM PUBLIC;
CREATE TABLE catalog.campaigns (
 id uuid PRIMARY KEY,
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,80}$'),
 title text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('election','single_choice')),
 is_test boolean NOT NULL DEFAULT true CHECK (is_test = true),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','archived')),
 consent_version text NOT NULL CHECK (length(consent_version) BETWEEN 1 AND 80)
);
CREATE TABLE catalog.campaign_options (
 campaign_id uuid NOT NULL REFERENCES catalog.campaigns(id),
 id uuid NOT NULL,
 label text NOT NULL,
 category text NOT NULL CHECK (category IN ('candidacy','blank','null','abstention','undecided','no_answer','topic')),
 PRIMARY KEY(campaign_id,id)
);
CREATE TABLE catalog.option_provinces (
 campaign_id uuid NOT NULL,
 option_id uuid NOT NULL,
 province_code char(2) NOT NULL REFERENCES reference.provinces(code),
 PRIMARY KEY(campaign_id,option_id,province_code),
 FOREIGN KEY(campaign_id,option_id) REFERENCES catalog.campaign_options(campaign_id,id)
);
CREATE TABLE authorization_private.one_time_tokens (
 digest char(64) PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'),
 campaign_id uuid NOT NULL REFERENCES catalog.campaigns(id),
 expires_at timestamptz NOT NULL,
 used_at timestamptz
);
CREATE TABLE participation_private.ballots (
 id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES catalog.campaigns(id),
 encrypted_payload text NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 UNIQUE(campaign_id,id)
);
CREATE TABLE authorization_private.credentials (
 digest char(64) PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'),
 campaign_id uuid NOT NULL,
 ballot_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(campaign_id,ballot_id) REFERENCES participation_private.ballots(campaign_id,id) ON DELETE CASCADE
);
CREATE TABLE authorization_private.consents (
 credential_digest char(64) PRIMARY KEY REFERENCES authorization_private.credentials(digest) ON DELETE CASCADE,
 version text NOT NULL,
 accepted_at date NOT NULL DEFAULT CURRENT_DATE
);
CREATE TABLE aggregation_private.counts (
 campaign_id uuid NOT NULL,
 municipality_code char(5) NOT NULL REFERENCES reference.municipalities(ine_code),
 option_id uuid NOT NULL,
 responses bigint NOT NULL CHECK (responses >= 0),
 PRIMARY KEY(campaign_id,municipality_code,option_id),
 FOREIGN KEY(campaign_id,option_id) REFERENCES catalog.campaign_options(campaign_id,id)
);
CREATE TABLE authorization_private.rate_buckets (
 scope_digest char(64) PRIMARY KEY CHECK (scope_digest ~ '^[a-f0-9]{64}$'),
 hits integer NOT NULL CHECK (hits > 0),
 expires_at timestamptz NOT NULL
);
CREATE TABLE publication.releases (
 id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL UNIQUE REFERENCES catalog.campaigns(id),
 published_at timestamptz NOT NULL DEFAULT now(),
 metric text NOT NULL CHECK (metric = 'closed_campaign_active_responses'),
 review_reference text NOT NULL CHECK (length(review_reference) BETWEEN 8 AND 200),
 payload jsonb NOT NULL,
 is_test boolean NOT NULL DEFAULT true CHECK (is_test = true)
);
CREATE INDEX counts_campaign_idx ON aggregation_private.counts(campaign_id);
CREATE INDEX token_expiry_idx ON authorization_private.one_time_tokens(expires_at);
CREATE INDEX bucket_expiry_idx ON authorization_private.rate_buckets(expires_at);
CREATE INDEX ballots_campaign_idx ON participation_private.ballots(campaign_id);
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('authorization_private','participation_private','aggregation_private','publication') OR (schemaname='catalog' AND tablename IN ('campaigns','campaign_options','option_provinces')) LOOP
 EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', t.schemaname,t.tablename);
 EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC',t.schemaname,t.tablename);
 END LOOP;
END $$;
COMMIT;
