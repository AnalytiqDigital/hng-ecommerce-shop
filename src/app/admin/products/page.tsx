import { desc } from "drizzle-orm";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";

export default async function AdminProductsPage() {
  const db = getDb();
  const [items, categoryOptions] = await Promise.all([db.select().from(products).orderBy(desc(products.createdAt)), db.select({ id: categories.id, name: categories.name }).from(categories)]);
  return <><p className="text-[10px] uppercase tracking-[0.18em] text-clay">Catalog</p><h1 className="mt-2 font-display text-[38px]">Products</h1><p className="mt-2 text-[12px] text-muted">Create and publish catalog items. Prices are entered in naira and stored in kobo. New items receive Natural, Olive, and Charcoal variants with stock split across colors.</p><ProductCreateForm categories={categoryOptions} /><div className="mt-9 overflow-x-auto border-t border-line"><table className="w-full min-w-[650px] text-left text-[11px]"><thead><tr className="text-muted"><th className="py-3 font-normal">Product</th><th className="font-normal">SKU</th><th className="font-normal">Price</th><th className="font-normal">Stock</th><th className="font-normal">Status</th></tr></thead><tbody>{items.map((product) => <tr key={product.id} className="border-t border-line"><td className="py-4 font-medium">{product.name}</td><td>{product.sku}</td><td>{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(product.priceCents / 100)}</td><td>{product.stockQuantity}</td><td className="capitalize">{product.status}</td></tr>)}</tbody></table></div></>;
}