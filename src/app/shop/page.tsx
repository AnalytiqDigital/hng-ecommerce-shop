import { ShopCatalog } from "@/components/shop-catalog";
import { getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/store-settings.server";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getStoreSettings()]);
  return <ShopCatalog products={products} currency={settings.currency} />;
}