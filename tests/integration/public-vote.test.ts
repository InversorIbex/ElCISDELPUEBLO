import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { saveApprovedVote, type Vote } from "../../lib/server/public-vote.ts";
import { voteDbConfig } from "../../lib/server/vote-db.ts";

const url=process.env.TEST_VOTE_DATABASE_URL;
if(!url) throw new Error("TEST_VOTE_DATABASE_URL_REQUIRED");
if(process.env.NODE_ENV==="production") throw new Error("PRODUCTION_TEST_FORBIDDEN");
if(process.env.TEST_DB_BRANCH_NAME!=="el-pueblo-opina-prelaunch-validation")
  throw new Error("TEST_NEON_BRANCH_REQUIRED");
if(!url.startsWith("postgresql://") && !url.startsWith("postgres://"))
  throw new Error("INVALID_TEST_DB_URL");
const pool=new Pool({...voteDbConfig(url),max:8});
const secret=process.env.TEST_VOTE_HMAC_SECRET;
if(!secret || secret.length<32) throw new Error("TEST_VOTE_HMAC_SECRET_REQUIRED");
const candidacyId="c52d79f1-37b1-509c-b597-303b410d427d";
const browser=()=>randomBytes(32).toString("hex");
const nextIP=()=>{const b=randomBytes(4);return `fd42:${b.subarray(0,2).toString("hex")}:${b.subarray(2,4).toString("hex")}::1`;};
const input=(ip:string,browserToken=browser()):Vote=>({
  ip,browserToken,provinceCode:"27",candidacyId,requestToken:randomUUID(),
});
async function existingVotes(ip:string, date:string) {
  // For tests prefer assertions about accepted count + commit, never query by a raw client IP in application code.
  const r=await pool.query("SELECT count(*)::int AS n FROM poll_private.ballots WHERE campaign_id='congress-2026' AND cast_on >= $1",[date]);
  return Number(r.rows[0].n);
}
test("transactional quota and idempotency against isolated Neon branch",async(t)=>{
  try {
    await t.test("2 per IP in 1 hour, third rejected with retry time", async()=>{
      const ip=nextIP();
      assert.equal((await saveApprovedVote(pool,secret,input(ip))).accepted,true);
      assert.equal((await saveApprovedVote(pool,secret,input(ip))).accepted,true);
      const third=await saveApprovedVote(pool,secret,input(ip));
      assert.equal(third.code,"IP_WINDOW_LIMIT");
      assert.ok("retryAfterSeconds" in third && third.retryAfterSeconds>3600-120);
    });
    await t.test("one vote per persistent browser token for the whole campaign",async()=>{
      const id=browser();
      assert.equal((await saveApprovedVote(pool,secret,input(nextIP(),id))).accepted,true);
      assert.deepEqual(await saveApprovedVote(pool,secret,input(nextIP(),id)),{accepted:false,code:"BROWSER_LIMIT"});
    });
    await t.test("idempotent request never inserts twice",async()=>{
      const v=input(nextIP());
      assert.equal((await saveApprovedVote(pool,secret,v)).accepted,true);
      assert.deepEqual(await saveApprovedVote(pool,secret,v),{accepted:false,code:"ALREADY_SUBMITTED"});
    });
    await t.test("3 concurrent requests allow at most 2 from one IP",async()=>{
      const ip=nextIP();
      const results=await Promise.all([1,2,3].map(()=>saveApprovedVote(pool,secret,input(ip))));
      assert.equal(results.filter(r=>r.accepted).length,2);
    });
    await t.test("different province rejected before touching DB",async()=>{
      const v={...input(nextIP()),provinceCode:"28"};
      assert.deepEqual(await saveApprovedVote(pool,secret,v),{accepted:false,code:"INVALID_CANDIDACY"});
    });
  }finally{await pool.end();}
});
