import test from "node:test";
import assert from "node:assert/strict";
import { ldJson, faqLd, breadcrumbLd, SITE_URL } from "../lib/seo.ts";
import { NATIONAL_PARTIES } from "../lib/parties.ts";

test("dominio canónico de producción", () => {
  assert.equal(SITE_URL, "https://www.laopiniondelpueblo.eu");
});
test("JSON-LD válido y sin cierre de <script> inyectable", () => {
  const out = ldJson(faqLd([["¿</script>?", "a"]]), breadcrumbLd([{ name: "Inicio", path: "/" }]));
  assert.ok(!out.includes("</script>"));
  const parsed = JSON.parse(out);
  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(parsed["@graph"][1].itemListElement[0].item, "https://www.laopiniondelpueblo.eu/");
});
test("fichas de partido: principales fuerzas con candidaturas", () => {
  const ids = NATIONAL_PARTIES.map((p) => p.id);
  for (const id of ["PP", "PSOE", "VOX"]) assert.ok(ids.includes(id));
  assert.equal(NATIONAL_PARTIES.find((p) => p.id === "PP")!.provinceCodes.length, 52);
  assert.equal(new Set(NATIONAL_PARTIES.map((p) => p.slug)).size, NATIONAL_PARTIES.length);
});
