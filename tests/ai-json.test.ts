import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson } from "../src/lib/ai/json";

test("parses clean JSON", () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson("[1,2,3]"), [1, 2, 3]);
});

test("parses fenced JSON", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('```\n{"a":{"b":2}}\n```'), { a: { b: 2 } });
});

test("parses JSON embedded in prose", () => {
  assert.deepEqual(
    extractJson('Sure! Here is the JSON you asked for: {"leads":[{"score":90}]} — hope that helps!'),
    { leads: [{ score: 90 }] },
  );
});

test("returns null on garbage or empty", () => {
  assert.equal(extractJson(""), null);
  assert.equal(extractJson("no json here at all"), null);
  assert.equal(extractJson("{broken"), null);
});

test("nested braces survive extraction", () => {
  const obj = { a: { b: { c: [1, 2] } } };
  assert.deepEqual(extractJson(`noise ${JSON.stringify(obj)} noise`), obj);
});
