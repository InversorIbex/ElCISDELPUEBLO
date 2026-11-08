-- El Congreso solo necesita circunscripción declarada, nunca municipio.
-- Migración del laboratorio: aborta si hay respuestas anteriores que requieren
-- descifrado/revisión, en lugar de reinterpretarlas o destruirlas.
BEGIN;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM participation_private.ballots)
 OR EXISTS (SELECT 1 FROM aggregation_private.counts) THEN
  RAISE EXCEPTION 'EMPTY_TEST_ENGINE_REQUIRED: review existing synthetic responses before migration';
 END IF;
END $$;
ALTER TABLE aggregation_private.counts DROP CONSTRAINT counts_municipality_code_fkey;
ALTER TABLE aggregation_private.counts RENAME COLUMN municipality_code TO province_code;
ALTER TABLE aggregation_private.counts ALTER COLUMN province_code TYPE char(2) USING left(province_code,2);
ALTER TABLE aggregation_private.counts ADD FOREIGN KEY(province_code) REFERENCES reference.provinces(code);
COMMIT;
