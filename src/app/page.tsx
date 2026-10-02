import { Storefront } from "@/components/storefront";
import { getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/store-settings.server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getStoreSettings()]);

  return <Storefront products={products} settings={settings} welcomeName={null} />;
}
