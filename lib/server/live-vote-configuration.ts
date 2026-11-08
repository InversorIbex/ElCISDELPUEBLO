/**
 * A single fail-closed launch decision shared by all vote endpoints.
 * Legal and security approval are separate, explicit operator actions.
 */
export const voteConsentVersion = "epov-2026-v1";
export function isLiveVoteConfigured(): boolean {
  return process.env.VERCEL_ENV==="production"
    && process.env.VOTE_PUBLIC_ENABLED==="true"
    && process.env.VOTE_PRIVACY_APPROVED==="true"
    && process.env.VOTE_SECURITY_APPROVED==="true"
    && process.env.VOTE_RETENTION_APPROVED==="true"
    && process.env.VOTE_BALLOTS_APPROVED==="true"
    && process.env.VOTE_RESULTS_POLICY_APPROVED==="true"
    && /^postgres(?:ql)?:\/\//.test(process.env.VOTE_DATABASE_URL??"")
    && (process.env.VOTE_HMAC_SECRET?.length??0)>=32
    && Boolean(process.env.TURNSTILE_SECRET_KEY)
    && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    && Boolean(process.env.VOTE_ALLOWED_HOSTNAME);
}
