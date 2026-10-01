import { Storefront } from "@/components/storefront";
import { getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/store-settings.server";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, settings, user] = await Promise.all([getProducts(), getStoreSettings(), getCurrentUser()]);
  const metadataName = user?.user_metadata.full_name ?? user?.user_metadata.name;
  const welcomeName = typeof metadataName === "string" ? metadataName.trim().split(/\s+/)[0] || null : null;

  return <Storefront products={products} settings={settings} welcomeName={welcomeName} />;
}
