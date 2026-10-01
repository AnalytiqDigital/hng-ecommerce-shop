import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destination =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  console.log("[AUTH CALLBACK] Started");

  if (code) {
    console.log("[AUTH CALLBACK] OAuth code received");

    const supabase = await createSupabaseServerClient();

    console.log("[AUTH CALLBACK] Exchanging code for session");

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("[AUTH CALLBACK] Session exchange successful");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("[AUTH CALLBACK] User:", user?.email ?? "NO USER");

      if (user?.email && process.env.DATABASE_URL) {
        console.log("[AUTH CALLBACK] Starting profile database write");

        await getDb()
          .insert(profiles)
          .values({
            id: user.id,
            email: user.email,
            fullName:
              user.user_metadata.full_name ??
              user.user_metadata.name ??
              null,
          })
          .onConflictDoUpdate({
            target: profiles.id,
            set: {
              email: user.email,
              updatedAt: new Date(),
            },
          });

        console.log("[AUTH CALLBACK] Profile database write successful");
      }

      console.log("[AUTH CALLBACK] Redirecting to:", destination);

      return NextResponse.redirect(new URL(destination, url.origin));
    }

    console.error("[AUTH CALLBACK] OAuth error:", error);
  }

  console.log("[AUTH CALLBACK] OAuth failed");

  return NextResponse.redirect(
    new URL("/login?error=oauth", url.origin),
  );
}