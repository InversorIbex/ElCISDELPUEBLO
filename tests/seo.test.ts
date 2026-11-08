import test from "node:test";
import assert from "node:assert/strict";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";
import { provinces, provincePath } from "../lib/territories.ts";

test("the information website is crawlable, while voting and API routes are excluded", () => {
  const result=robots();
  assert.deepEqual(result.rules, {userAgent:"*",allow:"/",disallow:["/api/","/participar","/resultados","/tendencias"]});
  assert.equal(result.sitemap,"https://elcisdelpueblo.vercel.app/sitemap.xml");
});
test("sitemap includes exactly 52 provincial pages and useful information pages",()=>{
  const urls=sitemap().map(x=>x.url);
  assert.equal(provinces.length,52);
  assert.equal(new Set(urls).size,urls.length);
  for(const p of provinces) assert.ok(urls.includes("https://elcisdelpueblo.vercel.app"+provincePath(p)));
  assert.ok(urls.includes("https://elcisdelpueblo.vercel.app/"));
  assert.ok(!urls.some(u=>u.includes("/participar")||u.includes("/resultados")||u.includes("/api/")));
});
