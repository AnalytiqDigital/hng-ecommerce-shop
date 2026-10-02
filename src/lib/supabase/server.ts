import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "./fetch";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured.");
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware/route handlers refresh them.
        }
      },
    },
  });
}
export async function getCurrentUser() {
  console.log("[AUTH] 1. getCurrentUser started");

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.log("[AUTH] 2. Supabase environment variables missing");
    return null;
  }

  try {
    console.log("[AUTH] 3. Creating Supabase server client");

    const supabase = await createSupabaseServerClient();

    console.log("[AUTH] 4. Calling supabase.auth.getUser()");

    const { data: { user }, error } = await supabase.auth.getUser();

    console.log(
      "[AUTH] 5. getUser completed:",
      user?.email ?? "NO USER",
      error?.message ?? "NO ERROR"
    );

    return user;
  } catch (error) {
    console.error(
      "[AUTH] ERROR:",
      error instanceof Error ? error.message : error
    );

    return null;
  }
}