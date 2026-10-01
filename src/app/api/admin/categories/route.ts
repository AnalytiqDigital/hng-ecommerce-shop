import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, categories } from "@/lib/db/schema";

const categoryInput = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(500).optional(), imageUrl: z.url().startsWith("https://").optional(), active: z.boolean().default(true) });

export async function GET() {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  return NextResponse.json({ categories: await getDb().select().from(categories).orderBy(asc(categories.name)) });
}

export async function POST(request: Request) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid category details." }, { status: 400 });
  try {
    const db = getDb();
    const [created] = await db.insert(categories).values(parsed.data).returning();
    await db.insert(auditLogs).values({ userId: access.user.id, action: "category.created", entity: "category", entityId: created.id });
    return NextResponse.json({ category: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category slug already exists or could not be saved." }, { status: 409 });
  }
}