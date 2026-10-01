import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export async function authorizeAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, status: 401 as const };
  if (!process.env.DATABASE_URL) return { user: null, status: 503 as const };
  const [admin] = await getDb().select({ userId: adminUsers.userId }).from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);
  if (!admin) return { user: null, status: 403 as const };
  return { user, status: 200 as const };
}