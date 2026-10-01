import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export default async function AdminCustomersPage() {
  const customers = await getDb().select({ id: profiles.id, name: profiles.fullName, email: profiles.email, phone: profiles.phone, createdAt: profiles.createdAt }).from(profiles).orderBy(asc(profiles.createdAt)).limit(500);
  return <><p className="text-[10px] uppercase tracking-[0.18em] text-clay">People</p><h1 className="mt-2 font-display text-[38px]">Customers</h1><p className="mt-2 text-[12px] text-muted">Customer contact information from registered accounts.</p><div className="mt-8 overflow-x-auto border-t border-line"><table className="w-full min-w-[600px] text-left text-[11px]"><thead><tr className="text-muted"><th className="py-3 font-normal">Customer</th><th className="font-normal">Email</th><th className="font-normal">Phone</th><th className="font-normal">Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-line"><td className="py-4">{customer.name ?? "Customer"}</td><td>{customer.email}</td><td>{customer.phone ?? "—"}</td><td>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(customer.createdAt)}</td></tr>)}</tbody></table></div></>;
}