import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, siteSettings } from "@/lib/db/schema";
import { storeSettingsSchema } from "@/lib/store-settings";

export async function PUT(request: Request) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const parsed = storeSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Some store settings are invalid. Check the highlighted fields." }, { status: 400 });

  try {
    const db = getDb();
    await db.insert(siteSettings).values({ key: "storefront", value: parsed.data }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: parsed.data, updatedAt: new Date() },
    });
    await db.insert(auditLogs).values({ userId: access.user.id, action: "store.settings_updated", entity: "site_settings", entityId: "storefront" });
    return NextResponse.json({ settings: parsed.data });
  } catch {
    return NextResponse.json({ error: "Store settings could not be saved." }, { status: 503 });
  }
}