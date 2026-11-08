/**
 * A single fail-closed launch decision shared by all vote endpoints.
 * Legal and security approval are separate, explicit operator actions.
 */
export const voteConsentVersion = "epov-2026-v1";
/** Names (never values) of launch settings that are missing or invalid. */
export function missingLiveVoteSettings(): string[] {
  const env=process.env;
  const checks:Array<[string,boolean]>=[
    ["VERCEL_ENV=production",env.VERCEL_ENV==="production"],
    ["VOTE_PUBLIC_ENABLED",env.VOTE_PUBLIC_ENABLED==="true"],
    ["VOTE_PRIVACY_APPROVED",env.VOTE_PRIVACY_APPROVED==="true"],
    ["VOTE_SECURITY_APPROVED",env.VOTE_SECURITY_APPROVED==="true"],
    ["VOTE_RETENTION_APPROVED",env.VOTE_RETENTION_APPROVED==="true"],
    ["VOTE_BALLOTS_APPROVED",env.VOTE_BALLOTS_APPROVED==="true"],
    ["VOTE_RESULTS_POLICY_APPROVED",env.VOTE_RESULTS_POLICY_APPROVED==="true"],
    ["VOTE_DATABASE_URL",/^postgres(?:ql)?:\/\//.test(env.VOTE_DATABASE_URL??"")],
    ["VOTE_HMAC_SECRET (>=32)",(env.VOTE_HMAC_SECRET?.length??0)>=32],
    ["TURNSTILE_SECRET_KEY",Boolean(env.TURNSTILE_SECRET_KEY)],
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY",Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)],
    ["VOTE_ALLOWED_HOSTNAME",Boolean(env.VOTE_ALLOWED_HOSTNAME)],
  ];
  return checks.filter(([,ok])=>!ok).map(([name])=>name);
}
export function isLiveVoteConfigured(): boolean {
  return missingLiveVoteSettings().length===0;
}
