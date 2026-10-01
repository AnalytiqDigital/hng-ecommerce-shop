import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export async function GET() {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  return NextResponse.json({ orders: await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(200) });
}