import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { launchStatus } from "@/lib/server/privacy-gates";
export const runtime="nodejs";
export async function POST(req:Request) {
  const origin=req.headers.get("origin");
  if(!origin || origin!==new URL(req.url).origin || req.headers.get("x-vote-request")!=="1")
    return Response.json({error:"INVALID_ORIGIN"},{status:403});
  if(process.env.VERCEL_ENV!=="production" || process.env.VOTE_PUBLIC_ENABLED!=="true" ||
      process.env.VOTE_PRIVACY_APPROVED!=="true" || process.env.VOTE_SECURITY_APPROVED!=="true")
    return Response.json({enabled:false},{status:423});
  const store=await cookies();
  const existing=store.get("epov_anon_v1")?.value;
  if(!existing || !/^[a-f0-9]{64}$/.test(existing)) {
    store.set("epov_anon_v1",randomBytes(32).toString("hex"),{
      httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*45,
    });
  }
  return Response.json({sessionReady:true},{headers:{"Cache-Control":"no-store"}});
}
