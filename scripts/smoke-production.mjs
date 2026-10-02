import assert from "node:assert/strict";

const baseUrl = (process.env.SMOKE_BASE_URL ?? "https://hng-ecommerce-shop.vercel.app").replace(/\/+$/, "");
const timeout = { signal: AbortSignal.timeout(15_000) };

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { ...timeout, redirect: "manual" });
  console.log(`${response.status} ${path}`);
  return response;
}

const home = await get("/");
assert.equal(home.status, 200, "homepage should load");
assert.match(await home.text(), /Form(?: &amp;| &) Field/i, "homepage should contain the store brand");

const productsResponse = await get("/api/products");
assert.equal(productsResponse.status, 200, "product API should respond successfully");
const productsData = await productsResponse.json();
assert.ok(Array.isArray(productsData.products) && productsData.products.length > 0, "product API should return products");

const product = await get(`/products/${encodeURIComponent(productsData.products[0].slug)}`);
assert.equal(product.status, 200, "a published product page should load");

const settings = await get("/api/store-settings");
assert.equal(settings.status, 200, "store settings API should respond successfully");

const admin = await get("/admin");
assert.ok([307, 308].includes(admin.status), "unauthenticated admin request should redirect");
assert.match(admin.headers.get("location") ?? "", /\/login/, "admin should redirect to login");

console.log("Production smoke checks passed. No order was created and no payment was charged.");
