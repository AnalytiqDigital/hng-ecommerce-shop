import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";

export async function GET(_request: Request, { params }: RouteContext<"/api/orders/payment/[reference]">) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Order status unavailable." }, { status: 503 });
  const { reference } = await params;
  if (!/^FF-[0-9a-f-]{36}$/i.test(reference)) return NextResponse.json({ error: "Invalid reference." }, { status: 400 });
  try {
    const [result] = await getDb().select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: payments.status,
    }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(eq(payments.reference, reference)).limit(1);
    if (!result) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Order status unavailable." }, { status: 503 });
  }
}