import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && process.env.DATABASE_URL) {
        await getDb().insert(profiles).values({ id: user.id, email: user.email, fullName: user.user_metadata.full_name ?? user.user_metadata.name ?? null })
          .onConflictDoUpdate({ target: profiles.id, set: { email: user.email, updatedAt: new Date() } });
      }
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}