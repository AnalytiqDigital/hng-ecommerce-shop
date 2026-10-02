import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  console.log("[ADMIN TEST] 1. Layout started");

  console.log("[ADMIN TEST] 2. Before getCurrentUser");

  const user = await getCurrentUser();

  console.log("[ADMIN TEST] 3. After getCurrentUser", user?.email ?? "NO USER");

  return (
    <div>
      {children}
    </div>
  );
}

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  console.log("[ADMIN] 1. Layout started");
console.log("[ADMIN] 2. Getting current user");

const user = await Promise.race([
  getCurrentUser(),
  new Promise<null>((resolve) =>
    setTimeout(() => {
      console.log("[ADMIN] AUTH TIMEOUT");
      resolve(null);
    }, 12_000)
  ),
]);

console.log("[ADMIN] 2b. getCurrentUser finished");

  console.log(
    "[ADMIN] 3. Current user:",
    user?.email ?? "NO USER"
  );

  if (!user) {
    console.log("[ADMIN] 4. No user - redirecting to login");
    redirect("/login?next=/admin");
  }

  if (!process.env.DATABASE_URL) {
    console.log("[ADMIN] 5. DATABASE_URL missing");
    redirect("/");
  }

  console.log("[ADMIN] 6. Checking admin_users");

  const [admin] = await getDb()
    .select({ userId: adminUsers.userId })
    .from(adminUsers)
    .where(eq(adminUsers.userId, user.id))
    .limit(1);

  console.log(
    "[ADMIN] 7. Admin query completed:",
    admin ? "ADMIN FOUND" : "NOT ADMIN"
  );

  if (!admin) {
    console.log("[ADMIN] 8. Not admin - redirecting");
    redirect("/");
  }

  console.log("[ADMIN] 9. Admin verified - rendering");

  return (
    <div className="min-h-screen bg-[#f1f2ed]">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-bold">
            Admin
          </Link>

          <div className="flex gap-4">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/categories">Categories</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/customers">Customers</Link>
            <Link href="/admin/content">Content</Link>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}