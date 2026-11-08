import test from "node:test";
import assert from "node:assert/strict";
import { madridCalendarDate, voteLimits } from "../lib/server/public-vote.ts";
test("two votes per IP per day and one per browser credential per campaign",() => {
  assert.deepEqual({...voteLimits},{perIpPerDay:2,perBrowserCampaign:1});
});
test("Madrid's calendar date handles DST independently of server locale",() => {
  assert.equal(madridCalendarDate(new Date("2026-11-08T23:30:00Z")),"2026-11-09");
  assert.equal(madridCalendarDate(new Date("2026-07-08T22:30:00Z")),"2026-07-09");
  assert.equal(madridCalendarDate(new Date("2026-11-08T21:30:00Z")),"2026-11-08");
});
