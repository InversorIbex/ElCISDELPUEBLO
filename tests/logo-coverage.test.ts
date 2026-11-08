import test from "node:test";
import assert from "node:assert/strict";
import { candidacies } from "../lib/candidacies/registry.ts";
import { logoForCandidacy } from "../lib/candidacies/logos.ts";
test("high-coverage parties have authentic sourced assets", () => {
  for (const n of ["VOX (VOX)","PARTIDO POPULAR (PP)","PARTIDO SOCIALISTA OBRERO ESPAÑOL (PSOE)","PODEMOS (PODEMOS)","PARTIDO COMUNISTA DE LOS TRABAJADORES DE ESPAÑA (PCTE)"]) {
    const logo=logoForCandidacy(n);
    assert.ok(logo, n);
    assert.ok(logo.sourcePage.startsWith("https://commons.wikimedia.org/"));
  }
});
test("all candidacies remain in electoral registry", () => {
  assert.equal(candidacies.length,534);
  assert.equal(new Set(candidacies.map(c=>c.id)).size,534);
});
test("coalitions are not assigned a member party logo by fuzzy matching",()=>{
  assert.equal(logoForCandidacy("UNIÓN DEL PUEBLO NAVARRO EN COALICIÓN CON EL PARTIDO POPULAR (UPN-PP)"),undefined);
});
