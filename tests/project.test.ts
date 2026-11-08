import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GET, POST } from "../app/api/status/route.ts";
import { participationStatus, project } from "../lib/project.ts";
test("el Hito 1 permanece cerrado para recogida sensible", () => {
  assert.equal(participationStatus().enabled, false);
  assert.equal(project.officialElectionVerified, true);
  assert.equal(project.officialCandidaciesVerified, false);
});
test("la API informa cierre y rechaza envíos reales", async () => {
  assert.equal(POST().status, 403);
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const body = await response.json();
  assert.equal(body.participation.enabled, false);
  assert.equal(body.resultsAvailable, false);
});
test("ninguna pantalla usa APIs de geolocalización ni almacena opiniones", () => {
  function scan(path: string) {
    for (const file of readdirSync(path, { withFileTypes: true })) {
      const name = join(path, file.name);
      if (file.isDirectory()) scan(name);
      else if (/\.(tsx?|css)$/.test(name)) {
        const content = readFileSync(name, "utf8");
        assert.doesNotMatch(
          content,
          /navigator\.geolocation|localStorage|sessionStorage|watchPosition|getCurrentPosition/,
        );
      }
    }
  }
  scan("app");
  scan("components");
});
test("los avisos y la no indexación acompañan la consulta", () => {
  const layout = readFileSync("app/layout.tsx", "utf8").replace(/\s+/g, " ");
  assert.match(layout, /index: false/);
  assert.match(
    layout,
    /no constituyen una muestra estadísticamente representativa/,
  );
  assert.match(
    readFileSync("app/page.tsx", "utf8"),
    /SONDEO ABIERTO DE INTERNAUTAS — MUESTRA NO REPRESENTATIVA/,
  );
});
