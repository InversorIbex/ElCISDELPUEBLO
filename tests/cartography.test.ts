import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import map from "../data/cartography/communities-svg.json" with { type: "json" };
import { communities, communityPath } from "../lib/territories.ts";
test("mapa IGN contiene las 19 comunidades/ciudades y enlaces correctos", () => {
  assert.equal(map.features.length, 19);
  for (const c of communities) {
    const f = map.features.find((f) => f.code === c.code);
    assert.ok(f);
    assert.equal(f.href, communityPath(c));
    assert.equal(f.nationalCode, `34${c.code}0000000`);
    assert.equal(f.valid, true);
    assert.match(f.path, /^M[-\d.,LZM]+Z$/);
  }
});
test("Canarias, Ceuta y Melilla tienen recuadros y Baleares está incluido", () => {
  for (const code of ["05", "18", "19"])
    assert.equal(map.features.find((f) => f.code === code)?.inset, true);
  assert.equal(map.features.find((f) => f.code === "04")?.inset, false);
});
test("orígenes verificados, licencia y reducción de puntos se conservan", () => {
  assert.equal(map.license, "CC BY 4.0 ign.es");
  assert.equal(map.sources.length, 19);
  for (const source of map.sources) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(source.url.startsWith("https://www.ign.es/wfs-inspire/"));
    assert.ok(source.simplifiedPoints < source.originalPoints);
  }
  assert.ok(statSync("data/cartography/communities-svg.json").size < 400000);
});
