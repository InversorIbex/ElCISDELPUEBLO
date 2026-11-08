import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
export function privateSecret() {
  return randomBytes(32).toString("base64url");
}
export function validateSecret(secret: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret))
    throw new Error("INVALID_CREDENTIAL");
}
export function digest(
  key: Buffer,
  campaign: string,
  secret: string,
  purpose: "credential" | "token" | "rate",
) {
  if (key.length !== 32) throw new Error("INVALID_KEY");
  return createHmac("sha256", key)
    .update(JSON.stringify([purpose, campaign, secret]))
    .digest("hex");
}
export function seal(
  key: Buffer,
  campaign: string,
  ballotId: string,
  payload: unknown,
) {
  if (key.length !== 32) throw new Error("INVALID_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(JSON.stringify([campaign, ballotId])));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}
export function unseal<T>(
  key: Buffer,
  campaign: string,
  ballotId: string,
  encoded: string,
): T {
  const [version, iv, tag, ciphertext, ...extra] = encoded.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra.length)
    throw new Error("INVALID_ENVELOPE");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(JSON.stringify([campaign, ballotId])));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8"),
  ) as T;
}
