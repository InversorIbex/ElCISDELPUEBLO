-- Draft for separately reviewed production participation. Apply ONLY on isolated test branch before approval.
-- No public permissions; the server role must be granted minimum privileges only after launch approval.
BEGIN;
CREATE SCHEMA IF NOT EXISTS poll_private;
REVOKE ALL ON SCHEMA poll_private FROM PUBLIC;
-- Required for cross-constraint that the selected candidacy belongs to its province.
CREATE UNIQUE INDEX IF NOT EXISTS registry_edition_id_province_unique
 ON catalog.registered_congress_candidacies(edition_id,id,province_code);
CREATE TABLE IF NOT EXISTS poll_private.ballots (
 id uuid PRIMARY KEY,
 campaign_id text NOT NULL CHECK (campaign_id = 'congress-2026'),
 province_code char(2) NOT NULL REFERENCES reference.provinces(code),
 candidacy_id uuid NOT NULL,
 consent_version text NOT NULL DEFAULT 'epov-2026-v1' CHECK (consent_version = 'epov-2026-v1'),
 edition_id text NOT NULL DEFAULT 'congress-2026' CHECK (edition_id = 'congress-2026'),
 FOREIGN KEY (edition_id,candidacy_id,province_code)
  REFERENCES catalog.registered_congress_candidacies(edition_id,id,province_code),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ballots_campaign_province_idx ON poll_private.ballots (campaign_id,province_code,candidacy_id);
-- Digests are created with a secret HMAC; never store unencrypted IPs or device cookie values.
CREATE TABLE IF NOT EXISTS poll_private.ip_daily (
 campaign_id text NOT NULL,
 date_madrid date NOT NULL,
 ip_digest text NOT NULL CHECK (length(ip_digest) = 64),
 accepted integer NOT NULL DEFAULT 0 CHECK(accepted BETWEEN 0 AND 2),
 PRIMARY KEY(campaign_id,date_madrid,ip_digest)
);
CREATE TABLE IF NOT EXISTS poll_private.browser_daily (
 campaign_id text NOT NULL,
 date_madrid date NOT NULL,
 browser_digest text NOT NULL CHECK (length(browser_digest) = 64),
 accepted integer NOT NULL DEFAULT 0 CHECK(accepted BETWEEN 0 AND 2),
 PRIMARY KEY(campaign_id,date_madrid,browser_digest)
);
CREATE TABLE IF NOT EXISTS poll_private.mobile_lifetime (
 campaign_id text NOT NULL,
 browser_digest text NOT NULL CHECK (length(browser_digest)=64),
 accepted boolean NOT NULL DEFAULT true,
 PRIMARY KEY(campaign_id,browser_digest)
);
CREATE TABLE IF NOT EXISTS poll_private.idempotency (
 campaign_id text NOT NULL,
 request_digest text NOT NULL CHECK (length(request_digest)=64),
 accepted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(campaign_id,request_digest)
);
-- An authenticated and minimally privileged cleanup endpoint is implemented.\n-- Its production cron, credentials and E2E verification are still required before activation.\n-- Daily hashes: previous dates removed each successful run; request idempotency digests: 48h.\n-- Mobile lifetime marker and ballots require separate campaign-end/withdrawal policies.
ALTER TABLE poll_private.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.ip_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.browser_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.mobile_lifetime ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_private.idempotency ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA poll_private FROM PUBLIC;
COMMIT;
