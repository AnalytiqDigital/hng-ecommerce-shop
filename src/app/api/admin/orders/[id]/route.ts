import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { auditLogs, orders } from "@/lib/db/schema";

const statusInput = z.object({ status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]) });
const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const { id } = await params;
  const parsed = statusInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const db = getDb();
  const [current] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!transitions[current.status].includes(parsed.data.status)) return NextResponse.json({ error: `Cannot move an order from ${current.status} to ${parsed.data.status}.` }, { status: 409 });
  if (parsed.data.status === "refunded" && current.paymentStatus !== "paid") return NextResponse.json({ error: "Only paid orders can be marked refunded." }, { status: 409 });
  const [updated] = await db.update(orders).set({ status: parsed.data.status, paymentStatus: parsed.data.status === "refunded" ? "refunded" : current.paymentStatus, updatedAt: new Date() }).where(and(eq(orders.id, id), eq(orders.status, current.status))).returning();
  if (!updated) return NextResponse.json({ error: "Order changed while you were editing it. Refresh and try again." }, { status: 409 });
  await db.insert(auditLogs).values({ userId: access.user.id, action: "order.status_changed", entity: "order", entityId: id, metadata: { from: current.status, to: updated.status } });
  return NextResponse.json({ order: updated });
}