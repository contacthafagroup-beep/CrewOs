import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planFor,
  annualPriceCents,
  runsRemaining,
  isOverLimit,
  usagePercent,
  usageWarned,
  PLANS,
} from "../src/lib/plans";

test("planFor returns config for known tiers", () => {
  assert.equal(planFor("STARTER").name, "Starter");
  assert.equal(planFor("GROWTH").id, "GROWTH");
  assert.equal(planFor("SCALE").monthlyCents, 99900);
});

test("planFor falls back to STARTER for unknown/null", () => {
  assert.equal(planFor("NOPE").id, "STARTER");
  assert.equal(planFor(null).id, "STARTER");
  assert.equal(planFor(undefined).id, "STARTER");
});

test("annual price is 10x monthly (2 months free)", () => {
  for (const p of Object.values(PLANS)) {
    assert.equal(annualPriceCents(p.monthlyCents), p.annualCents);
    assert.equal(p.annualCents, p.monthlyCents * 10);
  }
});

test("run limit boundaries", () => {
  assert.equal(runsRemaining("STARTER", 0), 100);
  assert.equal(runsRemaining("STARTER", 100), 0);
  assert.equal(runsRemaining("STARTER", 150), 0);
  assert.equal(isOverLimit("STARTER", 99), false);
  assert.equal(isOverLimit("STARTER", 100), true);
  assert.equal(isOverLimit("STARTER", 101), true);
});

test("usage percent + warning thresholds", () => {
  assert.equal(usagePercent("STARTER", 50), 50);
  assert.equal(usagePercent("STARTER", 200), 100);
  assert.equal(usageWarned("STARTER", 79), false);
  assert.equal(usageWarned("STARTER", 80), true);
  assert.equal(usageWarned("STARTER", 95), true);
});

test("enterprise has effectively unlimited runs", () => {
  assert.equal(planFor("ENTERPRISE").runLimit, Number.MAX_SAFE_INTEGER);
  assert.equal(isOverLimit("ENTERPRISE", Number.MAX_SAFE_INTEGER - 1), false);
});
