import test from "node:test";
import assert from "node:assert/strict";
import { inPollBlackout } from "../lib/electoral-blackout.ts";
test("veda LOREG: 24-N 00:00 a 29-N 21:00 hora peninsular",()=>{
  assert.equal(inPollBlackout(new Date("2026-11-23T22:59:59Z")),false); // 23-N 23:59 Madrid
  assert.equal(inPollBlackout(new Date("2026-11-23T23:00:00Z")),true);  // 24-N 00:00 Madrid
  assert.equal(inPollBlackout(new Date("2026-11-29T19:59:59Z")),true);  // 29-N 20:59 Madrid
  assert.equal(inPollBlackout(new Date("2026-11-29T20:00:00Z")),false); // 29-N 21:00 Madrid
});
