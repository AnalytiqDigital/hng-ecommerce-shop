import assert from "node:assert/strict";
import test from "node:test";
import { calculateSubtotal, validateRequestedStock } from "./cart";

test("calculates a multi-item subtotal in integer minor units", () => {
  assert.equal(calculateSubtotal([{ priceCents: 1999, quantity: 2 }, { priceCents: 550, quantity: 3 }]), 5648);
});

test("rejects invalid cart quantities and prices", () => {
  assert.throws(() => calculateSubtotal([{ priceCents: 100, quantity: 0 }]), /positive integer quantities/);
  assert.throws(() => calculateSubtotal([{ priceCents: -1, quantity: 1 }]), /non-negative integer prices/);
});

test("stock validation prevents zero, fractional, and over-stock requests", () => {
  assert.equal(validateRequestedStock(2, 3), true);
  assert.equal(validateRequestedStock(4, 3), false);
  assert.equal(validateRequestedStock(0, 3), false);
  assert.equal(validateRequestedStock(1.5, 3), false);
});