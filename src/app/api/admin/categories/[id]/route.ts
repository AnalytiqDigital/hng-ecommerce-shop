import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, categories } from "@/lib/db/schema";

const categoryUpdate = z.object({ name: z.string().trim().min(2).max(100).optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), description: z.string().trim().max(500).nullable().optional(), imageUrl: z.url().startsWith("https://").nullable().optional(), active: z.boolean().optional() }).strict();

export async function PUT(request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const { id } = await params;
  const parsed = categoryUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return NextResponse.json({ error: "Invalid category update." }, { status: 400 });
  try {
    const db = getDb();
    const [updated] = await db.update(categories).set(parsed.data).where(eq(categories.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    await db.insert(auditLogs).values({ userId: access.user.id, action: "category.updated", entity: "category", entityId: id });
    return NextResponse.json({ category: updated });
  } catch {
    return NextResponse.json({ error: "Category could not be updated." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const { id } = await params;
  const [updated] = await getDb().update(categories).set({ active: false }).where(eq(categories.id, id)).returning({ id: categories.id });
  if (!updated) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  await getDb().insert(auditLogs).values({ userId: access.user.id, action: "category.archived", entity: "category", entityId: id });
  return NextResponse.json({ archived: true });
}