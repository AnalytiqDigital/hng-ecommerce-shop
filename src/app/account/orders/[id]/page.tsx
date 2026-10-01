import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [order] = await getDb().select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, user.id))).limit(1);
  if (!order) notFound();
  const items = await getDb().select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const money = (cents: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: order.currency, maximumFractionDigits: 0 }).format(cents / 100);
  return <main className="mx-auto min-h-[70vh] max-w-[960px] px-5 py-12 sm:px-8 lg:px-12"><Link href="/account" className="text-[11px] text-muted underline">Back to account</Link><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-clay">Order details</p><h1 className="mt-2 font-display text-[40px]">{order.orderNumber}</h1><p className="mt-2 text-[12px] capitalize text-muted">{order.status} · payment {order.paymentStatus}</p><div className="mt-8 border-t border-line">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-line py-4 text-[12px]"><span>{item.productName} <span className="text-muted">× {item.quantity}</span></span><span>{money(item.unitPriceCents * item.quantity)}</span></div>)}</div><div className="ml-auto mt-5 max-w-[300px] space-y-3 text-[12px]"><p className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotalCents)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{money(order.shippingCents)}</span></p><p className="flex justify-between border-t border-line pt-4 text-[14px] font-medium"><span>Total</span><span>{money(order.totalCents)}</span></p></div></main>;
}