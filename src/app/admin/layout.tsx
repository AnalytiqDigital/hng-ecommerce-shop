export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  console.log("[ADMIN TEST] 1. Layout started");
  console.log("[ADMIN TEST] 2. Layout function is running");

  return <>{children}</>;
}