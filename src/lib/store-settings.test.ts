import assert from "node:assert/strict";
import test from "node:test";
import { defaultStoreSettings, parseStoreSettings, storeSettingsSchema } from "./store-settings";

test("default store settings satisfy the persisted settings schema", () => {
  assert.equal(storeSettingsSchema.safeParse(defaultStoreSettings).success, true);
});

test("partial saved settings retain defaults for fields not stored yet", () => {
  const settings = parseStoreSettings({ storeName: "North House", currency: "GHS" });
  assert.equal(settings.storeName, "North House");
  assert.equal(settings.currency, "GHS");
  assert.equal(settings.heroTitle, defaultStoreSettings.heroTitle);
});

test("settings reject unsafe image URLs and unsupported currencies", () => {
  assert.equal(storeSettingsSchema.safeParse({ ...defaultStoreSettings, heroImageUrl: "javascript:alert(1)" }).success, false);
  assert.equal(storeSettingsSchema.safeParse({ ...defaultStoreSettings, currency: "BTC" }).success, false);
});