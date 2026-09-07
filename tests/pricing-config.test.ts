import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANS, PLAN_ORDER } from "../src/lib/plans";
import { PRICE_PER_MTOK, estCostCents } from "../src/lib/ai/pricing";
import { totalCents, fmtMoney } from "../src/lib/documents";

test("plan ladder is sane: 199 < 499 < 999", () => {
  const tiers = ["STARTER", "GROWTH", "SCALE"] as const;
  for (let i = 0; i < tiers.length - 1; i++) {
    assert.ok(PLANS[tiers[i]].monthlyCents < PLANS[tiers[i + 1]].monthlyCents);
    assert.ok(PLANS[tiers[i]].runLimit < PLANS[tiers[i + 1]].runLimit);
    assert.ok(PLANS[tiers[i]].seats < PLANS[tiers[i + 1]].seats);
  }
});

test("every plan has marketing copy and features", () => {
  for (const p of Object.values(PLANS)) {
    assert.ok(p.blurb.length > 10, `${p.id} blurb`);
    assert.ok(p.features.length >= 3, `${p.id} features`);
    for (const f of p.features) assert.ok(f.length > 0);
  }
});

test("plan order constant is complete", () => {
  assert.deepEqual(PLAN_ORDER, ["STARTER", "GROWTH", "SCALE", "ENTERPRISE"]);
});

test("mock model is free; known models priced; unknown get default", () => {
  assert.equal(estCostCents("crewos-mock-v1", 1_000_000, 1_000_000), 0);
  // gpt-4o-mini: $0.15/M in + $0.60/M out → 1M each = $0.75 = 75 cents
  assert.equal(estCostCents("gpt-4o-mini", 1_000_000, 1_000_000), 75);
  // unknown model: default 0.5 + 1.5 = $2 = 200 cents
  assert.equal(estCostCents("mystery-model", 1_000_000, 1_000_000), 200);
  // tiny usage rounds up to 1 cent
  assert.equal(estCostCents("gpt-4o", 100, 100), 1);
  for (const model of Object.keys(PRICE_PER_MTOK)) {
    assert.ok(PRICE_PER_MTOK[model].in >= 0);
    assert.ok(PRICE_PER_MTOK[model].out >= 0);
  }
});

test("document totals and money formatting", () => {
  const lines = [
    { description: "a", amountCents: 35000 },
    { description: "b", amountCents: 40000 },
  ];
  assert.equal(totalCents(lines), 75000);
  assert.equal(totalCents([]), 0);
  assert.equal(fmtMoney(19900), "$199");
  assert.equal(fmtMoney(150050), "$1,500.5");
  assert.equal(fmtMoney(1000, "EUR"), "€10");
});
