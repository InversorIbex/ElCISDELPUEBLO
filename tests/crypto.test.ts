import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  seal,
  unseal,
  digest,
  privateSecret,
  validateSecret,
} from "../lib/server/crypto.ts";
test("cifrado autenticado no revela el contenido y cambia en cada escritura", () => {
  const key = randomBytes(32);
  const payload = { optionId: "SYNTHETIC-A", municipalityCode: "27027" };
  const a = seal(key, "campaign-a", "ballot", payload);
  const b = seal(key, "campaign-a", "ballot", payload);
  assert.notEqual(a, b);
  assert.ok(!a.includes("27027"));
  assert.deepEqual(unseal(key, "campaign-a", "ballot", a), payload);
  assert.throws(() => unseal(key, "campaign-b", "ballot", a));
  assert.throws(() => unseal(key, "campaign-a", "other", a));
  assert.throws(() => unseal(randomBytes(32), "campaign-a", "ballot", a));
  const parts = a.split(".");
  parts[2] = Buffer.alloc(16).toString("base64url");
  assert.throws(() => unseal(key, "campaign-a", "ballot", parts.join(".")));
});
test("credenciales aleatorias, hashes separados por campaña y finalidad", () => {
  const key = randomBytes(32),
    secret = privateSecret();
  validateSecret(secret);
  assert.notEqual(secret, privateSecret());
  assert.notEqual(
    digest(key, "one", secret, "credential"),
    digest(key, "two", secret, "credential"),
  );
  assert.notEqual(
    digest(key, "one", secret, "credential"),
    digest(key, "one", secret, "token"),
  );
  assert.throws(() => validateSecret("123"));
  assert.throws(() => seal(Buffer.alloc(16), "a", "b", {}));
});
