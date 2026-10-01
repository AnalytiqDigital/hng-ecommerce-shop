import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { adminUsers, profiles } from "../src/lib/db/schema";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.DATABASE_URL;
if (!email || !url || !serviceKey || !connectionString) {
  throw new Error("Set ADMIN_EMAIL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL before provisioning.");
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw error;
const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
if (!user?.email) throw new Error(`No Supabase Auth user found for ${email}. Sign in with Google once before provisioning.`);

const sql = postgres(connectionString, { max: 1, prepare: false, ssl: "require" });
try {
  const db = drizzle(sql);
  await db.insert(profiles).values({ id: user.id, email: user.email, fullName: user.user_metadata.full_name ?? user.user_metadata.name ?? null }).onConflictDoUpdate({ target: profiles.id, set: { email: user.email, updatedAt: new Date() } });
  await db.insert(adminUsers).values({ userId: user.id }).onConflictDoNothing();
  console.log(`Admin access provisioned for ${user.email}.`);
} finally {
  await sql.end();
}