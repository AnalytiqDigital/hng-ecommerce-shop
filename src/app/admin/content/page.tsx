import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { getStoreSettings } from "@/lib/store-settings.server";

export default async function AdminContentPage() {
  const settings = await getStoreSettings();
  return <><p className="text-[10px] uppercase tracking-[0.18em] text-clay">Storefront editor</p><h1 className="mt-2 font-display text-[38px]">Content & store</h1><p className="mb-8 mt-2 text-[12px] text-muted">Manage your brand, homepage sections, contact details, currency, and delivery pricing.</p><StoreSettingsForm initialSettings={settings} /></>;
}