import { NextResponse } from "next/server";
import logos from "@/data/candidacies/external-logo-sources.json";
export const runtime = "nodejs";
const known = new Map(logos.logos.map(l => [l.id,l]));
export async function GET(_request: Request, context: {params:Promise<{id:string}>}) {
  const {id} = await context.params;
  const match = known.get(id);
  if (!match) return new Response("Not found", {status:404,headers:{"Cache-Control":"no-store"}});
  const url = new URL(match.sourceAsset);
  if (url.hostname!=="commons.wikimedia.org" || url.protocol!=="https:") return new Response("Invalid source",{status:503});
  url.searchParams.set("width","320");
  try {
    const response=await fetch(url.toString(),{next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
    if(!response.ok)return new Response("Logo temporarily unavailable",{status:502});
    const ct=response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    // Browser-bound SVG/XML is intentionally rejected; Wikimedia raster thumbnail only.
    if(!["image/png","image/jpeg","image/webp"].includes(ct)) return new Response("Thumbnail not rasterized",{status:502});
    const content=await response.arrayBuffer();
    if(content.byteLength===0 || content.byteLength>1_000_000)return new Response("Invalid image size",{status:502});
    return new NextResponse(content,{headers:{"Content-Type":ct,"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff"}});
  } catch {
    return new Response("Logo unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
