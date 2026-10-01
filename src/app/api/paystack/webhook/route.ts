import { isValidPaystackSignature } from "@/lib/paystack";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orderItems, orders, payments, productVariants, products } from "@/lib/db/schema";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";
import { isMatchingSuccessfulPayment } from "@/lib/paystack";

type PaystackVerification = {
  status?: boolean;
  data?: { status?: string; reference?: string; amount?: number; currency?: string };
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.DATABASE_URL) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!isValidPaystackSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody.toString("utf8")) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true });

  const reference = event.data.reference;
  try {
    const verificationResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const verification = await verificationResponse.json() as PaystackVerification;
    const verified = verification.data;
    if (!verificationResponse.ok || !verification.status || verified?.status !== "success" || verified.reference !== reference) {
      return NextResponse.json({ error: "Transaction verification failed." }, { status: 400 });
    }

    const db = getDb();
    const email = await db.transaction(async (tx) => {
      const [payment] = await tx.select().from(payments).where(eq(payments.reference, reference)).for("update");
      if (!payment) throw new Error("Unknown payment reference.");
      if (payment.status === "paid") return null;
      if (!isMatchingSuccessfulPayment(verified, { reference, amount: payment.amountCents, currency: payment.currency })) {
        throw new Error("Verified amount or currency does not match the order.");
      }

      const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).for("update");
      if (!order) throw new Error("Order not found.");
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const item of [...items].sort((left, right) => (left.productId ?? "").localeCompare(right.productId ?? ""))) {
        if (!item.productId) throw new Error("An ordered product is no longer available for inventory reconciliation.");
        const updated = await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`, updatedAt: new Date() }).where(and(eq(products.id, item.productId), gte(products.stockQuantity, item.quantity))).returning({ id: products.id });
        if (updated.length !== 1) throw new Error("Insufficient stock to finalize this paid order.");
        if (item.variantId) {
          const variantUpdate = await tx.update(productVariants).set({ stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}` }).where(and(eq(productVariants.id, item.variantId), eq(productVariants.productId, item.productId), eq(productVariants.active, true), gte(productVariants.stockQuantity, item.quantity))).returning({ id: productVariants.id });
          if (variantUpdate.length !== 1) throw new Error("Insufficient stock for the selected product color.");
        }
      }
      await tx.update(payments).set({ status: "paid", verifiedAt: new Date(), providerData: verified }).where(eq(payments.id, payment.id));
      await tx.update(orders).set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id));
      return { recipient: order.customerEmail, customerName: order.customerName, orderNumber: order.orderNumber, totalCents: order.totalCents, items: items.map((item) => ({ name: item.productName, quantity: item.quantity, unitPriceCents: item.unitPriceCents })) };
    });

    if (email) await sendOrderConfirmationEmail(email);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Payment event could not be finalized." }, { status: 500 });
  }
}