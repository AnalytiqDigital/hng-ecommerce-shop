import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, productVariants, products } from "@/lib/db/schema";
import { defaultProductColors, distributeVariantStock } from "@/lib/product-variants";

const productInput = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(10000),
  shortDescription: z.string().trim().max(300).optional(),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().nullable().optional(),
  sku: z.string().trim().min(2).max(80),
  stockQuantity: z.number().int().min(0),
  categoryId: z.string().uuid().nullable().optional(),
  imageUrl: z.url().startsWith("https://"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export async function GET() {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  return NextResponse.json({ products: await getDb().select().from(products).orderBy(desc(products.createdAt)) });
}

export async function POST(request: Request) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const parsed = productInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  try {
    const db = getDb();
    const created = await db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values(parsed.data).returning();
      const stock = distributeVariantStock(product.stockQuantity, defaultProductColors.length);
      await tx.insert(productVariants).values(defaultProductColors.map((color, index) => ({
        productId: product.id,
        name: color.name,
        colorHex: color.colorHex,
        sku: `${product.sku}-C${index + 1}`,
        stockQuantity: stock[index],
        imageUrl: product.imageUrl,
        position: index,
      })));
      return product;
    });
    await db.insert(auditLogs).values({ userId: access.user.id, action: "product.created", entity: "product", entityId: created.id, metadata: { slug: created.slug } });
    return NextResponse.json({ product: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Product could not be created. Check the slug, SKU, and category." }, { status: 409 });
  }
}