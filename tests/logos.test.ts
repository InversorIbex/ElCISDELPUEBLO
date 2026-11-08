import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { logoAssets, logoForCandidacy } from "../lib/candidacies/logos.ts";
import { candidacies } from "../lib/candidacies/registry.ts";
import associations from "../data/candidacies/logo-associations.json" with { type: "json" };

test("logos locales: integridad, fuentes oficiales y SVG sin contenido activo", () => {
  assert.equal(logoAssets.length, 17);
  assert.equal(readdirSync("public/logos").length, 17);
  const ids = new Set(logoAssets.map((l) => l.id));
  for (const id of Object.values(associations)) assert.ok(ids.has(id));
  for (const logo of logoAssets) {
    assert.match(logo.path, /^\/logos\/[a-z]+\.(png|jpg|svg)$/);
    assert.equal(logo.sourceType, "formation_official_website");
    assert.ok(logo.sourcePage.startsWith("https://"));
    const bytes = readFileSync("public" + logo.path);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      logo.assetSha256,
    );
    if (logo.path.endsWith(".svg")) {
      const svg = bytes.toString();
      assert.doesNotMatch(
        svg,
        /<(?:script|foreignObject|image|use)\b|\son[a-z]+\s*=|<!DOCTYPE|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i,
      );
    }
  }
});
test("la ausencia de logo no elimina opciones ni sustituye coaliciones por sus componentes", () => {
  const covered = candidacies.filter((c) => logoForCandidacy(c.officialName));
  assert.equal(covered.length, 161);
  assert.equal(candidacies.length - covered.length, 373);
  assert.equal(logoForCandidacy("COALICIÓN NO REVISADA"), undefined);
});
