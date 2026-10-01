import postgres from "postgres";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { categories, productVariants, products } from "../src/lib/db/schema";
import { distributeVariantStock, getProductColors } from "../src/lib/product-variants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before running the seed script.");

const sql = postgres(connectionString, { max: 1, prepare: false, ssl: "require" });
const db = drizzle(sql);

const categoryRows = [
  { name: "Home", slug: "home", description: "Useful pieces for considered spaces.", imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80" },
  { name: "Accessories", slug: "accessories", description: "Well-made everyday carry.", imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80" },
  { name: "Lighting", slug: "lighting", description: "Warm light for slower evenings.", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80" },
  { name: "Clothing", slug: "clothing", description: "Comfortable, natural layers.", imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80" },
  { name: "Objects", slug: "objects", description: "Small details, made to last.", imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=800&q=80" },
];

const productRows = [
  { name: "Form stoneware vase", slug: "form-stoneware-vase", category: "home", price: 4850000, sku: "FF-HM-001", stock: 12, image: "photo-1578500494198-246f612d3b3d", featured: true, description: "A quietly sculptural vessel, shaped and glazed by hand in a soft chalk finish." },
  { name: "Everyday canvas tote", slug: "everyday-canvas-tote", category: "accessories", price: 3200000, sku: "FF-AC-001", stock: 8, image: "photo-1590874103328-eac38a683ce7", featured: true, description: "A sturdy, considered carryall in heavyweight washed cotton canvas." },
  { name: "Arc table light", slug: "arc-table-light", category: "lighting", price: 11200000, sku: "FF-LT-001", stock: 5, image: "photo-1507473885765-e6ed057f782c", featured: true, description: "Warm, focused light with a brushed brass stem and an opal glass shade." },
  { name: "Linen weekend shirt", slug: "linen-weekend-shirt", category: "clothing", price: 6800000, sku: "FF-CL-001", stock: 17, image: "photo-1598033129183-c4f50c736f10", featured: true, description: "An easy, breathable layer cut from European flax linen in a natural oat tone." },
  { name: "Daily object tray", slug: "daily-object-tray", category: "objects", price: 2650000, sku: "FF-OB-001", stock: 22, image: "photo-1603006905003-be475563bc59", featured: false, description: "A small catch-all tray for the useful objects that deserve a place of their own." },
  { name: "Woven market basket", slug: "woven-market-basket", category: "accessories", price: 5400000, sku: "FF-AC-002", stock: 9, image: "photo-1544816155-12df9643f363", featured: false, description: "A handwoven, generously sized basket for market mornings and slow weekends." },
  { name: "Ripple glass tumbler set", slug: "ripple-glass-tumbler-set", category: "home", price: 3650000, sku: "FF-HM-002", stock: 16, image: "photo-1513558161293-cdaf765edfd7", featured: false, description: "Four softly rippled glasses that feel just right in the hand." },
  { name: "Sculpted oak stool", slug: "sculpted-oak-stool", category: "home", price: 18900000, sku: "FF-HM-003", stock: 4, image: "photo-1503602642458-232111445657", featured: true, description: "A solid oak stool with a quiet silhouette and a hand-finished seat." },
  { name: "Soft form cushion", slug: "soft-form-cushion", category: "home", price: 4200000, sku: "FF-HM-004", stock: 13, image: "photo-1584100936595-c0654b55a2e2", featured: false, description: "A tactile linen cushion cover in a warm natural tone, made for daily use." },
  { name: "Studio shoulder bag", slug: "studio-shoulder-bag", category: "accessories", price: 7900000, sku: "FF-AC-003", stock: 7, image: "photo-1584917865442-de89df76afd3", featured: false, description: "A compact everyday bag with considered pockets and a comfortable strap." },
  { name: "Ribbed cotton pullover", slug: "ribbed-cotton-pullover", category: "clothing", price: 9200000, sku: "FF-CL-002", stock: 11, image: "photo-1576566588028-4147f3842f27", featured: false, description: "A soft mid-weight cotton layer with an easy fit and enduring shape." },
  { name: "Fluted ceramic bowl", slug: "fluted-ceramic-bowl", category: "objects", price: 2850000, sku: "FF-OB-002", stock: 19, image: "photo-1610701596007-11502861dcfa", featured: false, description: "A versatile ceramic bowl with a hand-pressed profile and satin glaze." },
  { name: "Paper lantern pendant", slug: "paper-lantern-pendant", category: "lighting", price: 13800000, sku: "FF-LT-002", stock: 6, image: "photo-1507473885765-e6ed057f782c", featured: false, description: "A softly diffused pendant that brings an inviting glow to a room." },
  { name: "Brass key ring", slug: "brass-key-ring", category: "accessories", price: 1450000, sku: "FF-AC-004", stock: 30, image: "photo-1611652022419-a9419f74343d", featured: false, description: "A solid brass key ring that develops a gentle patina with use." },
  { name: "Linen table runner", slug: "linen-table-runner", category: "home", price: 3950000, sku: "FF-HM-005", stock: 14, image: "photo-1600210492486-724fe5c67fb0", featured: false, description: "A relaxed linen runner for everyday meals and long-table gatherings." },
];

try {
  await db.insert(categories).values(categoryRows).onConflictDoNothing({ target: categories.slug });
  const savedCategories = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIds = new Map(savedCategories.map((category) => [category.slug, category.id]));
  await db.insert(products).values(productRows.map((product) => ({
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.description,
    priceCents: product.price,
    sku: product.sku,
    stockQuantity: product.stock,
    categoryId: categoryIds.get(product.category),
    imageUrl: `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=1000&q=85`,
    featured: product.featured,
    status: "published" as const,
  }))).onConflictDoNothing({ target: products.slug });
  const savedProducts = await db.select({
    id: products.id,
    sku: products.sku,
    stockQuantity: products.stockQuantity,
    imageUrl: products.imageUrl,
    category: categories.slug,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id));
  await db.insert(productVariants).values(savedProducts.flatMap((product) => {
    const colors = getProductColors(product.category);
    const stock = distributeVariantStock(product.stockQuantity, colors.length);
    return colors.map((color, index) => ({
      productId: product.id,
      name: color.name,
      colorHex: color.colorHex,
      sku: `${product.sku}-C${index + 1}`,
      stockQuantity: stock[index],
      imageUrl: product.imageUrl,
      position: index,
      active: true,
    }));
  })).onConflictDoNothing({ target: [productVariants.productId, productVariants.name] });
  console.log(`Seeded ${categoryRows.length} categories, ${productRows.length} sample products, and color variants for ${savedProducts.length} products (existing slugs/names were left unchanged).`);
} finally {
  await sql.end();
}