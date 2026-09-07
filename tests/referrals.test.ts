import { test } from "node:test";
import assert from "node:assert/strict";
import { referralCreditCents, newReferralCode, isValidReferralCode } from "../src/lib/referrals-core";

test("credit is $100", () => {
  assert.equal(referralCreditCents(), 10000);
});

test("codes are well-formed and unique-ish", () => {
  const a = newReferralCode();
  const b = newReferralCode();
  assert.match(a, /^CREW-[A-HJ-NP-Z2-9]{8}$/);
  assert.match(b, /^CREW-[A-HJ-NP-Z2-9]{8}$/);
  assert.notEqual(a, b);
});

test("deterministic with injected rng", () => {
  let i = 0;
  const seq = () => [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8][i++ % 8];
  const code = newReferralCode(seq);
  assert.match(code, /^CREW-[A-HJ-NP-Z2-9]{8}$/);
  const again = newReferralCode(seq);
  assert.equal(code, again);
});

test("validates referral codes strictly", () => {
  assert.equal(isValidReferralCode("CREW-ABCD2345"), true);
  assert.equal(isValidReferralCode("crew-abcd2345"), true); // case-insensitive
  assert.equal(isValidReferralCode("CREW-0O1IABCD"), false); // lookalikes excluded
  assert.equal(isValidReferralCode("SHORT"), false);
  assert.equal(isValidReferralCode(null), false);
  assert.equal(isValidReferralCode(""), false);
});
