import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { Pool, PoolClient } from "pg";
import { candidaciesForProvince } from "../candidacies/registry.ts";
const CAMPAIGN = "congress-2026";
export const voteLimits = Object.freeze({desktopPerIpPerDay:2, desktopPerBrowserPerDay:2, mobilePerBrowserCampaign:1});
export type Mode = "mobile" | "desktop";
export type Vote = { provinceCode:string; candidacyId:string; browserToken:string; ip:string; mode:Mode; requestToken:string };
export function madridCalendarDate(now:Date) {
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const read=(type:string)=>parts.find(p=>p.type===type)?.value;
  const [year,month,day]=[read("year"),read("month"),read("day")];
  if(!year||!month||!day)throw new Error("INVALID_CALENDAR_DATE");
  return `${year}-${month}-${day}`;
}
function hmac(secret:string, scope:string,value:string) {
  return createHmac("sha256",secret).update(scope).update("\0").update(value).digest("hex");
}
function allowedChoice(provinceCode:string,candidacyId:string) {
  return candidaciesForProvince(provinceCode).some(c => c.id===candidacyId);
}
async function upsertCounter(client:PoolClient,table:"ip_daily"|"browser_daily",campaignId:string,date:string,digest:string,max:number) {
  const column=table==="ip_daily"?"ip_digest":"browser_digest";
  const rows=await client.query(`
    INSERT INTO poll_private.${table}(campaign_id,date_madrid,${column},accepted) VALUES($1,$2,$3,1)
    ON CONFLICT(campaign_id,date_madrid,${column})
    DO UPDATE SET accepted=poll_private.${table}.accepted+1 WHERE poll_private.${table}.accepted < $4
    RETURNING accepted`,[campaignId,date,digest,max]);
  return rows.rowCount===1;
}
/** Fully atomic storage; this function alone does NOT authorize a live public endpoint. */
export async function saveApprovedVote(pool:Pool, secret:string, vote:Vote, now=new Date()) {
  if(secret.length<32)throw new Error("HMAC_SECRET_REQUIRED");
  if(!/^[0-9]{2}$/.test(vote.provinceCode)||!allowedChoice(vote.provinceCode,vote.candidacyId))
    return {accepted:false,code:"INVALID_CANDIDACY"} as const;
  if(!/^[a-f0-9]{64}$/.test(vote.browserToken)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(vote.requestToken))
    return {accepted:false,code:"INVALID_TOKEN"} as const;
  if(isIP(vote.ip) === 0 || !["desktop","mobile"].includes(vote.mode))
    return {accepted:false,code:"INVALID_CLIENT"} as const;
  const date=madridCalendarDate(now);
  const ipHash=hmac(secret,`${CAMPAIGN}:ip:${date}`,vote.ip);
  const browserHash=hmac(secret,`${CAMPAIGN}:browser`,vote.browserToken);
  const requestHash=hmac(secret,`${CAMPAIGN}:request`,vote.requestToken);
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize on IP and browser to prevent concurrent double acceptance.
    const lockKeys=[ipHash,browserHash].sort();
    for(const key of lockKeys)await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[key]);
    const seen=await client.query("SELECT 1 FROM poll_private.idempotency WHERE campaign_id=$1 AND request_digest=$2",[CAMPAIGN,requestHash]);
    if(seen.rowCount){await client.query("ROLLBACK");return {accepted:false,code:"ALREADY_SUBMITTED"} as const;}
    const prior=await client.query("SELECT accepted FROM poll_private.ip_daily WHERE campaign_id=$1 AND date_madrid=$2 AND ip_digest=$3",[CAMPAIGN,date,ipHash]);
    if(prior.rows[0]?.accepted>=voteLimits.desktopPerIpPerDay){await client.query("ROLLBACK");return {accepted:false,code:"IP_DAILY_LIMIT"} as const;}
    if(vote.mode==="mobile"){
      const already=await client.query("SELECT 1 FROM poll_private.mobile_lifetime WHERE campaign_id=$1 AND browser_digest=$2",[CAMPAIGN,browserHash]);
      if(already.rowCount){await client.query("ROLLBACK");return {accepted:false,code:"MOBILE_BROWSER_LIMIT"} as const;}
    } else {
      const previous=await client.query("SELECT accepted FROM poll_private.browser_daily WHERE campaign_id=$1 AND date_madrid=$2 AND browser_digest=$3",[CAMPAIGN,date,browserHash]);
      if(previous.rows[0]?.accepted>=voteLimits.desktopPerBrowserPerDay){await client.query("ROLLBACK");return {accepted:false,code:"DESKTOP_BROWSER_LIMIT"} as const;}
    }
    if(!await upsertCounter(client,"ip_daily",CAMPAIGN,date,ipHash,2))throw new Error("IP_LIMIT_RACE");
    if(vote.mode==="mobile"){
      await client.query("INSERT INTO poll_private.mobile_lifetime(campaign_id,browser_digest) VALUES($1,$2)",[CAMPAIGN,browserHash]);
    }else{
      if(!await upsertCounter(client,"browser_daily",CAMPAIGN,date,browserHash,2))throw new Error("BROWSER_LIMIT_RACE");
    }
    // Do not link stored ballot rows to browser or IP identifiers.
    await client.query("INSERT INTO poll_private.ballots(id,campaign_id,province_code,candidacy_id) VALUES($1,$2,$3,$4)",
      [randomUUID(),CAMPAIGN,vote.provinceCode,vote.candidacyId]);
    await client.query("INSERT INTO poll_private.idempotency(campaign_id,request_digest) VALUES($1,$2)",[CAMPAIGN,requestHash]);
    await client.query("COMMIT");
    return {accepted:true,code:"RECORDED"} as const;
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}
