import { privateSecret, validateSecret } from "./crypto.ts";
const NAME = "__Secure-cis-response";
export function campaignCredentialPath(campaignId: string) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      campaignId,
    )
  )
    throw new Error("INVALID_CAMPAIGN");
  return `/api/sondeos/${campaignId}/participacion`;
}
// Contrato de sesión para el futuro endpoint del sondeo. No se emite desde las rutas públicas cerradas.
export function createBrowserCredential(campaignId: string, remember = false) {
  const secret = privateSecret();
  const path = campaignCredentialPath(campaignId);
  return {
    secret,
    cookie: `${NAME}=${secret}; Path=${path}; HttpOnly; Secure; SameSite=Strict${remember ? "; Max-Age=2592000" : ""}`,
  };
}
export function readBrowserCredential(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const matches = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.startsWith(NAME + "="));
  if (matches.length !== 1) return null;
  const secret = matches[0].slice(NAME.length + 1);
  try {
    validateSecret(secret);
    return secret;
  } catch {
    return null;
  }
}
export function clearBrowserCredential(campaignId: string) {
  return `${NAME}=; Path=${campaignCredentialPath(campaignId)}; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
