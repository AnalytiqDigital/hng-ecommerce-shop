import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, productVariants, products } from "@/lib/db/schema";
import { distributeVariantStock } from "@/lib/product-variants";

const productUpdate = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().min(10).max(10000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  priceCents: z.number().int().positive().optional(),
  compareAtPriceCents: z.number().int().positive().nullable().optional(),
  sku: z.string().trim().min(2).max(80).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  imageUrl: z.url().startsWith("https://").optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
}).strict();

export async function PUT(request: Request, { params }: RouteContext<"/api/admin/products/[id]">) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const { id } = await params;
  const parsed = productUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  try {
    const db = getDb();
    const updated = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(products).where(eq(products.id, id)).for("update");
      if (!current) return undefined;
      const [product] = await tx.update(products).set({ ...parsed.data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
      if (parsed.data.stockQuantity !== undefined) {
        const variants = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id)).for("update");
        if (variants.length > 0) {
          const distribution = distributeVariantStock(parsed.data.stockQuantity, variants.length);
          for (const [index, variant] of variants.entries()) {
            await tx.update(productVariants).set({ stockQuantity: distribution[index] }).where(eq(productVariants.id, variant.id));
          }
        }
      }
      return product;
    });
    if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    await db.insert(auditLogs).values({ userId: access.user.id, action: "product.updated", entity: "product", entityId: id, metadata: parsed.data });
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: "Product could not be updated." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/products/[id]">) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const { id } = await params;
  const db = getDb();
  const [updated] = await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, id)).returning({ id: products.id });
  if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  await db.insert(auditLogs).values({ userId: access.user.id, action: "product.archived", entity: "product", entityId: id });
  return NextResponse.json({ archived: true });
}