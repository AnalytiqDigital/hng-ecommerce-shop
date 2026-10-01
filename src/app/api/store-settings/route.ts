import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-settings.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ settings: await getStoreSettings() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Store settings are unavailable." }, { status: 503 });
  }
}