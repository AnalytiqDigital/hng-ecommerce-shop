import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!process.env.DATABASE_URL) redirect("/");
  const [admin] = await getDb().select({ userId: adminUsers.userId }).from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);
  if (!admin) redirect("/");
  return <div className="min-h-screen bg-[#f1f2ed]"><header className="border-b border-line bg-paper"><div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"><Link href="/admin" className="font-display text-[22px]">Form & Field <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted">/ Studio</span></Link><Link href="/" className="text-[10px] uppercase tracking-[0.13em]">View shop ↗</Link></div></header><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[210px_1fr]"><nav className="flex gap-5 overflow-x-auto border-b border-line px-5 py-4 text-[11px] lg:min-h-[calc(100vh-68px)] lg:flex-col lg:border-b-0 lg:border-r lg:px-7 lg:py-8"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/content">Content & store</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/customers">Customers</Link></nav><div className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</div></div></div>;
}