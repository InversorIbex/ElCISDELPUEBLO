import test from "node:test";
import assert from "node:assert/strict";
import { approvedProvinceResult, percent } from "../lib/published-provincial.ts";
import { provinces } from "../lib/territories.ts";

test("no provincial percentages are published before approval", () => {
  assert.equal(provinces.length, 52);
  for (const province of provinces) assert.equal(approvedProvinceResult(province.code), null);
});
test("percentages use the denominator of candidacy answers", () => {
  assert.equal(percent(25,100),25);
  assert.equal(percent(1,0),null);
});
