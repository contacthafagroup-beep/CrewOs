import { test } from "node:test";
import assert from "node:assert/strict";
import { clampScore, scoreBand } from "../src/lib/agents/scoring";

test("clamps to 0-100", () => {
  assert.equal(clampScore(-5), 0);
  assert.equal(clampScore(150), 100);
  assert.equal(clampScore(73.6), 74);
});

test("accepts numeric strings, rejects junk", () => {
  assert.equal(clampScore("88"), 88);
  assert.equal(clampScore("  62 "), 62);
  assert.equal(clampScore("abc"), 50);
  assert.equal(clampScore(NaN), 50);
  assert.equal(clampScore(undefined), 50);
  assert.equal(clampScore(null), 50);
  assert.equal(clampScore("", 42), 42);
});

test("score bands", () => {
  assert.equal(scoreBand(95), "hot");
  assert.equal(scoreBand(80), "hot");
  assert.equal(scoreBand(79), "warm");
  assert.equal(scoreBand(60), "warm");
  assert.equal(scoreBand(59), "cool");
  assert.equal(scoreBand(0), "cool");
});
