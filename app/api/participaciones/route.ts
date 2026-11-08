import { isIP } from "node:net";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { saveApprovedVote } from "@/lib/server/public-vote";
import { closedParticipationResponse, launchStatus } from "@/lib/server/privacy-gates";
import { isLiveVoteConfigured, voteConsentVersion } from "@/lib/server/live-vote-configuration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CONSENT_VERSION = voteConsentVersion;
let pool: Pool | undefined;
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

function getPool() {
  const url=process.env.VOTE_DATABASE_URL;
  if(!url) throw new Error("NO_VOTE_DATABASE");
  pool ??= new Pool({connectionString:url,max:4,connectionTimeoutMillis:4000,statement_timeout:8000,idleTimeoutMillis:10000});
  return pool;
}
function validOrigin(req:Request) {
  const origin=req.headers.get("origin");
  return Boolean(origin && origin===new URL(req.url).origin
    && new URL(origin).hostname===process.env.VOTE_ALLOWED_HOSTNAME);
}
function trustedIp(req:Request):string|null {
  if(!process.env.VERCEL) return null;
  // Vercel overwrites this field on incoming requests.
  const ip=req.headers.get("x-vercel-forwarded-for");
  return ip && isIP(ip)!==0 ? ip : null;
}
async function verifyChallenge(token:string,ip:string,requestId:string):Promise<boolean> {
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret || token.length<1 || token.length>2048) return false;
  try {
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({secret,response:token,remoteip:ip,idempotency_key:requestId}),
      signal:AbortSignal.timeout(8000),cache:"no-store",
    });
    if(!response.ok)return false;
    const result=await response.json() as {success?:boolean;hostname?:string;action?:string};
    return result.success===true && result.hostname===process.env.VOTE_ALLOWED_HOSTNAME
      && result.action==="citizen_vote";
  }catch{return false;}
}
export function GET() {
  const status=launchStatus();
  return json({...status,enabled:isLiveVoteConfigured(),mode:isLiveVoteConfigured()?"open":"closed",
    consentVersion:CONSENT_VERSION,
    siteKey:isLiveVoteConfigured()?process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY:undefined});
}
export async function POST(req:Request) {
  if(!isLiveVoteConfigured())return closedParticipationResponse();
  if(!validOrigin(req) || req.headers.get("x-vote-request")!=="1")return json({error:"INVALID_ORIGIN"},403);
  if(!(req.headers.get("content-type")??"").startsWith("application/json"))return json({error:"INVALID_CONTENT_TYPE"},415);
  const ip=trustedIp(req);
  if(!ip)return json({error:"UNVERIFIED_CLIENT_IP"},403);
  let body:unknown;
  try { const raw=await req.text();if(raw.length>4096)return json({error:"PAYLOAD_TOO_LARGE"},413);body=JSON.parse(raw); }
  catch {return json({error:"INVALID_JSON"},400);}
  if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"INVALID_REQUEST"},400);
  const b=body as Record<string,unknown>;
  if(b.explicitConsent!==true||b.consentVersion!==CONSENT_VERSION)return json({error:"CONSENT_REQUIRED"},400);
  const provinceCode=b.provinceCode, candidacyId=b.candidacyId, requestToken=b.requestToken,turnstileToken=b.turnstileToken;
  if(typeof provinceCode!=="string"||typeof candidacyId!=="string"||
    typeof requestToken!=="string"||typeof turnstileToken!=="string"||
    !/^[0-9]{2}$/.test(provinceCode)||!/^[0-9a-f-]{36}$/i.test(candidacyId)||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestToken))
    return json({error:"INVALID_REQUEST"},400);
  const cookie=(await cookies()).get("epov_anon_v1")?.value;
  if(!cookie||!/^[a-f0-9]{64}$/.test(cookie))return json({error:"SESSION_REQUIRED"},403);
  if(!await verifyChallenge(turnstileToken,ip,requestToken))return json({error:"CHALLENGE_INVALID"},403);
  try {
    const result=await saveApprovedVote(getPool(),process.env.VOTE_HMAC_SECRET!,{
      provinceCode,candidacyId,browserToken:cookie,ip,requestToken,
    });
    if(result.accepted) return json({recorded:true,code:"RECORDED"});
    const code=result.code;
    return json({recorded:false,code},code==="INVALID_CANDIDACY"?400:409);
  } catch {
    // Never echo DB errors or sensitive details back to browser.
    return json({recorded:false,error:"TEMPORARILY_UNAVAILABLE"},503);
  }
}
