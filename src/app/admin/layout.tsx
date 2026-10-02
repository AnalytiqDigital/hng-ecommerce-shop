import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  console.log("[ADMIN TEST] 1. Layout started");

  console.log("[ADMIN TEST] 2. Before getCurrentUser");

  const user = await getCurrentUser();

  console.log(
    "[ADMIN TEST] 3. After getCurrentUser",
    user?.email ?? "NO USER"
  );

  return <>{children}</>;
}