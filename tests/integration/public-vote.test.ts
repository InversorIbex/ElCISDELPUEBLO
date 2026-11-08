import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { saveApprovedVote, type Vote } from "../../lib/server/public-vote.ts";

const url=process.env.TEST_VOTE_DATABASE_URL;
if(!url) throw new Error("TEST_VOTE_DATABASE_URL_REQUIRED");
if(process.env.NODE_ENV==="production") throw new Error("PRODUCTION_TEST_FORBIDDEN");
if(process.env.TEST_DB_BRANCH_NAME!=="el-pueblo-opina-prelaunch-validation")
  throw new Error("TEST_NEON_BRANCH_REQUIRED");
if(!url.startsWith("postgresql://") && !url.startsWith("postgres://"))
  throw new Error("INVALID_TEST_DB_URL");
const pool=new Pool({connectionString:url,max:8,connectionTimeoutMillis:5000,statement_timeout:10000});
const secret=process.env.TEST_VOTE_HMAC_SECRET;
if(!secret || secret.length<32) throw new Error("TEST_VOTE_HMAC_SECRET_REQUIRED");
const candidacyId="c52d79f1-37b1-509c-b597-303b410d427d";
const browser=()=>randomBytes(32).toString("hex");
const nextIP=()=>{const b=randomBytes(4);return `fd42:${b.subarray(0,2).toString("hex")}:${b.subarray(2,4).toString("hex")}::1`;};
const input=(ip:string,mode:"mobile"|"desktop",browserToken=browser()):Vote=>({
  ip,mode,browserToken,provinceCode:"27",candidacyId,requestToken:randomUUID(),
});
async function existingVotes(ip:string, date:string) {
  // For tests prefer assertions about accepted count + commit, never query by a raw client IP in application code.
  const r=await pool.query("SELECT count(*)::int AS n FROM poll_private.ballots WHERE campaign_id='congress-2026' AND created_at >= $1",[date]);
  return Number(r.rows[0].n);
}
test("transactional quota and idempotency against isolated Neon branch",async(t)=>{
  try {
    await t.test("desktop: 2 per IP/day, third rejected", async()=>{
      const ip=nextIP();
      assert.equal((await saveApprovedVote(pool,secret,input(ip,"desktop"))).accepted,true);
      assert.equal((await saveApprovedVote(pool,secret,input(ip,"desktop"))).accepted,true);
      assert.deepEqual(await saveApprovedVote(pool,secret,input(ip,"desktop")),{accepted:false,code:"IP_DAILY_LIMIT"});
    });
    await t.test("mobile: one per persistent browser token",async()=>{
      const id=browser();
      assert.equal((await saveApprovedVote(pool,secret,input(nextIP(),"mobile",id))).accepted,true);
      assert.deepEqual(await saveApprovedVote(pool,secret,input(nextIP(),"mobile",id)),{accepted:false,code:"MOBILE_BROWSER_LIMIT"});
    });
    await t.test("idempotent request never inserts twice",async()=>{
      const v=input(nextIP(),"desktop");
      assert.equal((await saveApprovedVote(pool,secret,v)).accepted,true);
      assert.deepEqual(await saveApprovedVote(pool,secret,v),{accepted:false,code:"ALREADY_SUBMITTED"});
    });
    await t.test("3 concurrent requests allow at most 2 from one IP",async()=>{
      const ip=nextIP();
      const results=await Promise.all([1,2,3].map(()=>saveApprovedVote(pool,secret,input(ip,"desktop"))));
      assert.equal(results.filter(r=>r.accepted).length,2);
    });
    await t.test("different province rejected before touching DB",async()=>{
      const v={...input(nextIP(),"desktop"),provinceCode:"28"};
      assert.deepEqual(await saveApprovedVote(pool,secret,v),{accepted:false,code:"INVALID_CANDIDACY"});
    });
  }finally{await pool.end();}
});
