import Link from "next/link";
import { count, desc, eq, lte, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, products, profiles } from "@/lib/db/schema";

export default async function AdminDashboard() {
  const db = getDb();
  const [[sales], [orderCount], [customerCount], [productCount], lowStock, recent] = await Promise.all([
    db.select({ total: sum(orders.totalCents) }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ total: count() }).from(orders),
    db.select({ total: count() }).from(profiles),
    db.select({ total: count() }).from(products).where(eq(products.status, "published")),
    db.select({ id: products.id, name: products.name, stock: products.stockQuantity }).from(products).where(lte(products.stockQuantity, 5)).orderBy(products.stockQuantity).limit(5),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, customer: orders.customerName, status: orders.status, total: orders.totalCents }).from(orders).orderBy(desc(orders.createdAt)).limit(6),
  ]);
  const stats = [{ label: "Paid sales", value: new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(sales.total ?? 0) / 100) }, { label: "Orders", value: orderCount.total }, { label: "Customers", value: customerCount.total }, { label: "Live products", value: productCount.total }];
  return <><p className="text-[10px] uppercase tracking-[0.18em] text-clay">Store overview</p><h1 className="mt-2 font-display text-[40px]">Good morning.</h1><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="border border-line bg-paper p-4 sm:p-5"><p className="text-[10px] uppercase tracking-[0.1em] text-muted">{stat.label}</p><p className="mt-3 text-[23px] font-medium">{stat.value}</p></article>)}</div><div className="mt-9 grid gap-8 xl:grid-cols-[1fr_320px]"><section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-[23px]">Recent orders</h2><Link href="/admin/orders" className="text-[10px] underline">All orders</Link></div><div className="overflow-x-auto border-t border-line"><table className="w-full min-w-[520px] text-left text-[11px]"><thead><tr className="text-muted"><th className="py-3 font-normal">Order</th><th className="font-normal">Customer</th><th className="font-normal">Status</th><th className="text-right font-normal">Total</th></tr></thead><tbody>{recent.map((order) => <tr key={order.id} className="border-t border-line"><td className="py-4 font-medium">{order.orderNumber}</td><td>{order.customer}</td><td className="capitalize">{order.status}</td><td className="text-right">{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(order.total / 100)}</td></tr>)}</tbody></table>{recent.length === 0 && <p className="py-8 text-center text-[12px] text-muted">Orders will appear here.</p>}</div></section><section><h2 className="mb-4 font-display text-[23px]">Low stock</h2><div className="border-t border-line">{lowStock.map((product) => <div key={product.id} className="flex justify-between gap-3 border-b border-line py-3 text-[11px]"><span>{product.name}</span><span className="shrink-0 text-clay">{product.stock} left</span></div>)}</div></section></div></>;
}