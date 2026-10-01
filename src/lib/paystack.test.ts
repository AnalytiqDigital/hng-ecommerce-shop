import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { isMatchingSuccessfulPayment, isValidPaystackSignature } from "./paystack";

test("validates Paystack HMAC signatures and rejects tampering", () => {
  const body = Buffer.from('{"event":"charge.success"}');
  const secret = "test-secret";
  const signature = createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(isValidPaystackSignature(body, signature, secret), true);
  assert.equal(isValidPaystackSignature(Buffer.from("{}"), signature, secret), false);
  assert.equal(isValidPaystackSignature(body, "not-a-signature", secret), false);
});

test("matches only successful transactions with the expected reference, amount, and currency", () => {
  const expected = { reference: "FF-test-reference", amount: 125000, currency: "NGN" };
  assert.equal(isMatchingSuccessfulPayment({ status: "success", ...expected }, expected), true);
  assert.equal(isMatchingSuccessfulPayment({ status: "success", ...expected, amount: 100 }, expected), false);
  assert.equal(isMatchingSuccessfulPayment({ status: "success", ...expected, currency: "USD" }, expected), false);
  assert.equal(isMatchingSuccessfulPayment({ status: "pending", ...expected }, expected), false);
});