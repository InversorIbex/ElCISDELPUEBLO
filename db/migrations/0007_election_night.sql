-- Recuento de la noche electoral del 29-N (datos oficiales cargados por el operador).
-- Una fila, sin datos personales. La API la crea también al arrancar si no existe.
BEGIN;
CREATE SCHEMA IF NOT EXISTS poll_private;
REVOKE ALL ON SCHEMA poll_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS poll_private.election_night (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE poll_private.election_night ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON poll_private.election_night FROM PUBLIC;
COMMIT;
