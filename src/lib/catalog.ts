import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { categories, productVariants, products } from "@/lib/db/schema";
import { distributeVariantStock, getProductColors } from "@/lib/product-variants";

export type CatalogVariant = {
  id: string;
  name: string;
  colorHex: string;
  sku: string;
  stockQuantity: number;
  imageUrl: string | null;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  imageUrl: string;
  stockQuantity: number;
  featured: boolean;
  variants: CatalogVariant[];
};

const demoProductsWithoutVariants: Omit<CatalogProduct, "variants">[] = [
  { id: "demo-01", slug: "form-stoneware-vase", name: "Form stoneware vase", category: "Home", description: "A quietly sculptural vessel, shaped and glazed by hand in a soft chalk finish.", priceCents: 4850000, compareAtPriceCents: null, imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85", stockQuantity: 12, featured: true },
  { id: "demo-02", slug: "everyday-canvas-tote", name: "Everyday canvas tote", category: "Accessories", description: "A sturdy, considered carryall in heavyweight washed cotton canvas.", priceCents: 3200000, compareAtPriceCents: 3900000, imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85", stockQuantity: 8, featured: true },
  { id: "demo-03", slug: "arc-table-light", name: "Arc table light", category: "Lighting", description: "Warm, focused light with a brushed brass stem and an opal glass shade.", priceCents: 11200000, compareAtPriceCents: null, imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85", stockQuantity: 5, featured: true },
  { id: "demo-04", slug: "linen-weekend-shirt", name: "Linen weekend shirt", category: "Clothing", description: "An easy, breathable layer cut from European flax linen in a natural oat tone.", priceCents: 6800000, compareAtPriceCents: null, imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85", stockQuantity: 17, featured: true },
  { id: "demo-05", slug: "daily-object-tray", name: "Daily object tray", category: "Home", description: "A small catch-all tray for the useful objects that deserve a place of their own.", priceCents: 2650000, compareAtPriceCents: null, imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85", stockQuantity: 22, featured: false },
  { id: "demo-06", slug: "woven-market-basket", name: "Woven market basket", category: "Accessories", description: "A handwoven, generously sized basket for market mornings and slow weekends.", priceCents: 5400000, compareAtPriceCents: null, imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=85", stockQuantity: 9, featured: false },
];

export const demoProducts: CatalogProduct[] = demoProductsWithoutVariants.map((product) => {
  const colors = getProductColors(product.category);
  const stock = distributeVariantStock(product.stockQuantity, colors.length);
  return {
    ...product,
    variants: colors.map((color, index) => ({
      id: `${product.id}-color-${index + 1}`,
      name: color.name,
      colorHex: color.colorHex,
      sku: `${product.id.toUpperCase()}-${index + 1}`,
      stockQuantity: stock[index],
      imageUrl: null,
    })),
  };
});

export async function getProducts(category?: string): Promise<CatalogProduct[]> {
  if (!process.env.DATABASE_URL) {
    return category ? demoProducts.filter((product) => product.category.toLowerCase() === category.toLowerCase()) : demoProducts;
  }

  const db = getDb();
  const rows = await db.select({
    id: products.id,
    slug: products.slug,
    name: products.name,
    description: products.shortDescription,
    priceCents: products.priceCents,
    compareAtPriceCents: products.compareAtPriceCents,
    imageUrl: products.imageUrl,
    stockQuantity: products.stockQuantity,
    featured: products.featured,
    categoryId: products.categoryId,
    category: categories.name,
    categorySlug: categories.slug,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.status, "published")).orderBy(desc(products.featured), desc(products.createdAt));

  const visibleRows = rows.filter((product) => !category || product.categorySlug === category.toLowerCase());
  const variantRows = visibleRows.length
    ? await db.select({
      id: productVariants.id,
      productId: productVariants.productId,
      name: productVariants.name,
      colorHex: productVariants.colorHex,
      sku: productVariants.sku,
      stockQuantity: productVariants.stockQuantity,
      imageUrl: productVariants.imageUrl,
    }).from(productVariants).where(and(inArray(productVariants.productId, visibleRows.map((product) => product.id)), eq(productVariants.active, true))).orderBy(productVariants.position)
    : [];
  const variantsByProduct = new Map<string, CatalogVariant[]>();
  for (const variant of variantRows) {
    const variants = variantsByProduct.get(variant.productId) ?? [];
    variants.push({ id: variant.id, name: variant.name, colorHex: variant.colorHex, sku: variant.sku, stockQuantity: variant.stockQuantity, imageUrl: variant.imageUrl });
    variantsByProduct.set(variant.productId, variants);
  }

  return visibleRows.map((product) => ({ ...product, category: product.category ?? "Objects", description: product.description ?? "Thoughtfully made for everyday use.", variants: variantsByProduct.get(product.id) ?? [] }));
}

async function loadProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  if (!process.env.DATABASE_URL) return demoProducts.find((product) => product.slug === slug);
  const db = getDb();
  const [product] = await db.select({
    id: products.id,
    slug: products.slug,
    name: products.name,
    description: products.description,
    priceCents: products.priceCents,
    compareAtPriceCents: products.compareAtPriceCents,
    imageUrl: products.imageUrl,
    stockQuantity: products.stockQuantity,
    featured: products.featured,
    status: products.status,
    category: categories.name,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.slug, slug)).limit(1);
  if (!product || product.status !== "published") return undefined;
  const variants = await db.select({
    id: productVariants.id,
    name: productVariants.name,
    colorHex: productVariants.colorHex,
    sku: productVariants.sku,
    stockQuantity: productVariants.stockQuantity,
    imageUrl: productVariants.imageUrl,
  }).from(productVariants).where(and(eq(productVariants.productId, product.id), eq(productVariants.active, true))).orderBy(productVariants.position);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category ?? "Objects",
    description: product.description,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    imageUrl: product.imageUrl,
    stockQuantity: product.stockQuantity,
    featured: product.featured,
    variants,
  };
}

export const getProductBySlug = cache(loadProductBySlug);