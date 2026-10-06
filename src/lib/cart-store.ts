import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cartItems, carts, productVariants, products } from "@/lib/db/schema";

export type CartInputLine = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export async function getUserCart(userId: string) {
  const db = getDb();
  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);
  if (!cart) return [];

  const rows = await db
    .select({
      productId: products.id,
      slug: products.slug,
      productName: products.name,
      priceCents: products.priceCents,
      productImageUrl: products.imageUrl,
      productStockQuantity: products.stockQuantity,
      quantity: cartItems.quantity,
      variantId: cartItems.variantId,
      variantName: productVariants.name,
      variantColorHex: productVariants.colorHex,
      variantSku: productVariants.sku,
      variantImageUrl: productVariants.imageUrl,
      variantStockQuantity: productVariants.stockQuantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(
      productVariants,
      and(
        eq(cartItems.variantId, productVariants.id),
        eq(productVariants.active, true),
      ),
    )
    .where(eq(cartItems.cartId, cart.id));

  return rows.map((line) => ({
    id: `${line.productId}:${line.variantId ?? "default"}`,
    productId: line.productId,
    slug: line.slug,
    productName: line.productName,
    name: line.variantName
      ? `${line.productName} · ${line.variantName}`
      : line.productName,
    priceCents: line.priceCents,
    imageUrl: line.variantImageUrl ?? line.productImageUrl,
    stockQuantity: line.variantStockQuantity ?? line.productStockQuantity,
    ...(line.variantId
      ? {
          variantId: line.variantId,
          variantName: line.variantName ?? undefined,
          variantColorHex: line.variantColorHex ?? undefined,
          variantSku: line.variantSku ?? undefined,
        }
      : {}),
    quantity: line.quantity,
  }));
}

export async function replaceUserCart(
  userId: string,
  requestedLines: CartInputLine[],
) {
  const mergedLines = new Map<string, CartInputLine>();
  for (const line of requestedLines) {
    const key = `${line.productId}:${line.variantId ?? "default"}`;
    const existing = mergedLines.get(key);
    const quantity = (existing?.quantity ?? 0) + line.quantity;
    if (quantity > 20) {
      throw new Error("Cart quantities cannot exceed 20 per product option.");
    }
    mergedLines.set(key, { ...line, quantity });
  }
  const lines = [...mergedLines.values()];
  const productIds = [...new Set(lines.map((line) => line.productId))];
  const db = getDb();

  const [availableProducts, availableVariants] = await Promise.all([
    productIds.length
      ? db
          .select()
          .from(products)
          .where(and(inArray(products.id, productIds), eq(products.status, "published")))
      : [],
    productIds.length
      ? db
          .select()
          .from(productVariants)
          .where(and(inArray(productVariants.productId, productIds), eq(productVariants.active, true)))
      : [],
  ]);
  const productsById = new Map(availableProducts.map((product) => [product.id, product]));
  const variantsById = new Map(availableVariants.map((variant) => [variant.id, variant]));
  const activeVariantCounts = new Map<string, number>();
  for (const variant of availableVariants) {
    activeVariantCounts.set(
      variant.productId,
      (activeVariantCounts.get(variant.productId) ?? 0) + 1,
    );
  }

  for (const line of lines) {
    const product = productsById.get(line.productId);
    const variant = line.variantId ? variantsById.get(line.variantId) : undefined;
    if (!product) throw new Error("One or more products are no longer available.");
    if ((activeVariantCounts.get(product.id) ?? 0) > 0 && !line.variantId) {
      throw new Error(`${product.name} requires a color selection.`);
    }
    if (line.variantId && (!variant || variant.productId !== product.id)) {
      throw new Error(`${product.name} color is no longer available.`);
    }
    if (line.quantity > (variant?.stockQuantity ?? product.stockQuantity)) {
      throw new Error(`${product.name} does not have enough stock.`);
    }
  }

  await db.transaction(async (tx) => {
    const [cart] = await tx
      .insert(carts)
      .values({ userId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: carts.userId,
        set: { updatedAt: new Date() },
      })
      .returning({ id: carts.id });

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    if (lines.length) {
      await tx.insert(cartItems).values(
        lines.map((line) => ({
          cartId: cart.id,
          productId: line.productId,
          variantId: line.variantId ?? null,
          quantity: line.quantity,
        })),
      );
    }
  });

  return getUserCart(userId);
}

export async function clearUserCart(userId: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [cart] = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .for("update")
      .limit(1);
    if (!cart) return;
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await tx
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));
  });
}
