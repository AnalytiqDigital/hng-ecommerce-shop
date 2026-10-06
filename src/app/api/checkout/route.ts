import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { calculateSubtotal } from "@/lib/cart";
import { getRequestUser } from "@/lib/supabase/request-user";
import { orderItems, orders, payments, productVariants, products } from "@/lib/db/schema";
import { getStoreSettings } from "@/lib/store-settings.server";

const mobileReturnUrlSchema = z.string().url().refine((value) => {
  const returnUrl = new URL(value);
  const nativeAppRoute =
    returnUrl.protocol === "mobile:" &&
    returnUrl.hostname === "payment-return" &&
    (returnUrl.pathname === "" || returnUrl.pathname === "/");
  const expoGoRoute =
    returnUrl.protocol === "exp:" &&
    /^\/(?:--\/)?payment-return\/?$/.test(returnUrl.pathname);
  return nativeAppRoute || expoGoRoute;
});

const checkoutSchema = z.object({
  customer: z.object({ fullName: z.string().trim().min(2).max(120), email: z.email(), phone: z.string().trim().min(7).max(30) }),
  shippingAddress: z.object({ addressLine1: z.string().trim().min(3).max(180), addressLine2: z.string().trim().max(180).optional().nullable(), city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100), country: z.string().trim().min(2).max(100), postalCode: z.string().trim().max(24).optional().nullable() }),
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  platform: z.enum(["web", "mobile"]).optional(),
  mobileReturnUrl: mobileReturnUrlSchema.optional(),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Checkout is unavailable until a production database is configured and seeded." }, { status: 503 });
  if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Paystack is not configured on this environment." }, { status: 503 });

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your contact details, delivery address, and cart quantities." }, { status: 400 });
  try {
    const db = getDb();
    const storeSettings = await getStoreSettings();
    const user = await getRequestUser(request);
    const ids = [...new Set(parsed.data.items.map((item) => item.productId))].sort();
    const lineMap = new Map<string, { productId: string; variantId?: string; quantity: number }>();
    for (const item of parsed.data.items) {
      const key = `${item.productId}:${item.variantId ?? "default"}`;
      const existing = lineMap.get(key);
      lineMap.set(key, { ...item, quantity: (existing?.quantity ?? 0) + item.quantity });
    }
    const requestedLines = [...lineMap.values()];
    const reference = `FF-${crypto.randomUUID()}`;
    const orderNumber = `FF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const order = await db.transaction(async (tx) => {
      const locked = await tx.select().from(products).where(inArray(products.id, ids)).for("update");
      if (locked.length !== ids.length) throw new Error("One or more products are no longer available.");
      const lockedVariants = await tx.select().from(productVariants).where(inArray(productVariants.productId, ids)).for("update");
      const productsById = new Map(locked.map((product) => [product.id, product]));
      const variantsById = new Map(lockedVariants.map((variant) => [variant.id, variant]));
      const activeVariantCounts = new Map<string, number>();
      for (const variant of lockedVariants) {
        if (variant.active) activeVariantCounts.set(variant.productId, (activeVariantCounts.get(variant.productId) ?? 0) + 1);
      }
      for (const product of locked) {
        const requestedStock = requestedLines.filter((line) => line.productId === product.id).reduce((total, line) => total + line.quantity, 0);
        if (requestedStock > product.stockQuantity) throw new Error(`${product.name} does not have enough stock.`);
      }

      const resolvedLines = requestedLines.map((line) => {
        const product = productsById.get(line.productId);
        const variant = line.variantId ? variantsById.get(line.variantId) : undefined;
        if (!product || product.status !== "published") throw new Error("One or more products are no longer available.");
        if ((activeVariantCounts.get(product.id) ?? 0) > 0 && !line.variantId) throw new Error(`${product.name} requires a color selection.`);
        if (line.variantId && (!variant || variant.productId !== product.id || !variant.active)) throw new Error(`${product.name} color is no longer available.`);
        const available = variant?.stockQuantity ?? product.stockQuantity;
        if (line.quantity > available) throw new Error(`${product.name}${variant ? ` in ${variant.name}` : ""} does not have enough stock.`);
        return { product, variant, quantity: line.quantity };
      });

      const subtotal = calculateSubtotal(resolvedLines.map(({ product, quantity }) => ({ priceCents: product.priceCents, quantity })));
      const shipping = subtotal >= storeSettings.freeShippingThresholdCents ? 0 : storeSettings.shippingFeeCents;
      const [created] = await tx.insert(orders).values({
        orderNumber,
        userId: user?.id ?? null,
        customerEmail: parsed.data.customer.email,
        customerName: parsed.data.customer.fullName,
        currency: storeSettings.currency,
        subtotalCents: subtotal,
        shippingCents: shipping,
        totalCents: subtotal + shipping,
        shippingAddress: parsed.data.shippingAddress,
      }).returning();

      await tx.insert(orderItems).values(resolvedLines.map(({ product, variant, quantity }) => ({
        orderId: created.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        variantColorHex: variant?.colorHex ?? null,
        productName: variant ? `${product.name} · ${variant.name}` : product.name,
        sku: variant?.sku ?? product.sku,
        unitPriceCents: product.priceCents,
        quantity,
      })));
      await tx.insert(payments).values({ orderId: created.id, reference, amountCents: created.totalCents, currency: storeSettings.currency });
      return created;
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const callbackUrl = new URL("/order-confirmation", siteUrl);
    callbackUrl.searchParams.set("reference", reference);
    if (parsed.data.platform === "mobile") {
      callbackUrl.searchParams.set("platform", "mobile");
      callbackUrl.searchParams.set(
        "returnUrl",
        parsed.data.mobileReturnUrl ?? "mobile://payment-return"
      );
    }
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: parsed.data.customer.email, amount: order.totalCents, currency: storeSettings.currency, reference, callback_url: callbackUrl.toString(), metadata: { orderNumber: order.orderNumber } }),
    });
    const result = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string } };
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await db.update(payments).set({ status: "failed" }).where(eq(payments.reference, reference));
      return NextResponse.json({ error: "Paystack could not start this payment. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, orderNumber: order.orderNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order.";
    const expected = /no longer available|does not have enough stock|requires a color selection|color is no longer available/i.test(message);
    return NextResponse.json({ error: expected ? message : "Unable to create your order right now." }, { status: expected ? 409 : 500 });
  }
}