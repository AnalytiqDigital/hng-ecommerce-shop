import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { defaultStoreSettings, parseStoreSettings } from "@/lib/store-settings";

export async function getStoreSettings() {
  if (!process.env.DATABASE_URL) return defaultStoreSettings;
  const [record] = await getDb().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "storefront")).limit(1);
  return record ? parseStoreSettings(record.value) : defaultStoreSettings;
}