import assert from "node:assert/strict";
import test from "node:test";
import { defaultProductColors, distributeVariantStock, getProductColors, productColorsByCategory } from "./product-variants";

test("each catalog category has three valid color options", () => {
  for (const colors of Object.values(productColorsByCategory)) {
    assert.equal(colors.length, 3);
    assert.ok(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color.colorHex)));
  }
  assert.equal(getProductColors("unlisted").length, defaultProductColors.length);
});

test("variant stock always adds up to the product inventory", () => {
  for (const stock of [0, 1, 2, 4, 12, 17]) {
    const distribution = distributeVariantStock(stock, 3);
    assert.equal(distribution.reduce((total, amount) => total + amount, 0), stock);
    assert.ok(distribution.every((amount) => amount >= 0));
    assert.ok(Math.max(...distribution) - Math.min(...distribution) <= 1);
  }
});