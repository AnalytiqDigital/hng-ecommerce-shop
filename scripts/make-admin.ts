import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { adminUsers, profiles } from "../src/lib/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password || !url || !serviceKey || !connectionString) {
    throw new Error(
      "Set ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL before provisioning."
    );
  }

  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters long.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`Checking Supabase Auth for ${email}...`);

  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (usersError) {
    throw usersError;
  }

  let user = usersData.users.find(
    (candidate) => candidate.email?.toLowerCase() === email
  );

  if (!user) {
    console.log("Admin user does not exist. Creating it...");

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Store Administrator",
      },
    });

    if (error) {
      throw error;
    }

    user = data.user;

    if (!user) {
      throw new Error("Supabase created the user but returned no user record.");
    }

    console.log("Supabase Auth admin user created.");
  } else {
    console.log("Admin user already exists. Updating password...");

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password,
        email_confirm: true,
      }
    );

    if (error) {
      throw error;
    }

    user = data.user;

    console.log("Admin password updated.");
  }

  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: "require",
  });

  try {
    const db = drizzle(sql);

    await db
      .insert(profiles)
      .values({
        id: user.id,
        email: user.email ?? email,
        fullName:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "Store Administrator",
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: user.email ?? email,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(adminUsers)
      .values({
        userId: user.id,
      })
      .onConflictDoNothing();

    console.log("");
    console.log("========================================");
    console.log("ADMIN ACCESS READY");
    console.log("========================================");
    console.log(`Email: ${email}`);
    console.log("Password: the value stored in ADMIN_PASSWORD");
    console.log("========================================");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error("Admin provisioning failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});