import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "./whatsapp";

test("normalizes international WhatsApp numbers and rejects short values", () => {
  assert.equal(normalizeWhatsAppNumber("+234 803-555-1212"), "2348035551212");
  assert.equal(normalizeWhatsAppNumber("123"), "");
});

test("builds an encoded wa.me link with a default for blank messages", () => {
  const url = new URL(buildWhatsAppUrl("+234 803 555 1212", "Hello, I need help with a vase.")!);
  assert.equal(url.host, "wa.me");
  assert.equal(url.pathname, "/2348035551212");
  assert.equal(url.searchParams.get("text"), "Hello, I need help with a vase.");
  assert.equal(new URL(buildWhatsAppUrl("+2348035551212", "")!).searchParams.get("text"), "Hello, I have a question.");
  assert.equal(buildWhatsAppUrl("bad", "Hello"), null);
});