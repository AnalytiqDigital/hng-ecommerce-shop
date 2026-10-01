import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const customerOrders = process.env.DATABASE_URL ? await getDb().select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(30) : [];
  return <main className="mx-auto min-h-[70vh] max-w-[1120px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-clay">Your space</p><h1 className="font-display text-[42px] sm:text-[50px]">Hello, {user.user_metadata.full_name ?? user.user_metadata.name ?? "there"}.</h1><p className="mt-2 text-[12px] text-muted">{user.email}</p></div><div className="flex gap-5"><Link href="/account/profile" className="text-[10px] uppercase tracking-[0.12em] underline underline-offset-4">Profile</Link><SignOutButton /></div></div><section className="mt-10"><div className="flex items-baseline justify-between border-b border-line pb-3"><h2 className="font-display text-[24px]">Recent orders</h2><span className="text-[10px] text-muted">{customerOrders.length} orders</span></div>{customerOrders.length ? <div>{customerOrders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="grid grid-cols-2 gap-3 border-b border-line py-5 text-[12px] sm:grid-cols-4"><span className="font-medium">{order.orderNumber}</span><span className="capitalize text-muted">{order.status}</span><span className="text-muted">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(order.createdAt)}</span><span className="text-right">{new Intl.NumberFormat("en-NG", { style: "currency", currency: order.currency, maximumFractionDigits: 0 }).format(order.totalCents / 100)}</span></Link>)}</div> : <div className="py-14 text-center"><p className="font-display text-[22px]">No orders just yet.</p><Link href="/shop" className="mt-3 inline-block text-[11px] underline">Find something considered</Link></div>}</section></main>;
}