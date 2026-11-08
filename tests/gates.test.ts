import test from "node:test";
import assert from "node:assert/strict";
import { createTestPool } from "../lib/server/db.ts";
import { TestParticipationService } from "../lib/server/participation.ts";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
test("la base de datos de pruebas requiere nombre _test", () => {
  assert.throws(
    () => createTestPool("postgresql://localhost/production"),
    /TEST_DATABASE_REQUIRED/,
  );
});
test("el laboratorio no puede instanciarse bajo NODE_ENV production", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      "import {createTestPool} from './lib/server/db.ts';createTestPool('postgresql://localhost/cis_test')",
    ],
    { env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TEST_ENGINE_ONLY/);
});
test("cifrado y hashes no comparten clave", async () => {
  const pool = createTestPool("postgresql://localhost/unused_test");
  try {
    const key = randomBytes(32);
    assert.throws(
      () => new TestParticipationService(pool, key, key),
      /INDEPENDENT_KEYS_REQUIRED/,
    );
  } finally {
    await pool.end();
  }
});
