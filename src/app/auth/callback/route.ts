import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  const destination =
    next?.startsWith("/") && !next.startsWith("//")
      ? next
      : "/account";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin)
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AUTH CALLBACK] OAuth exchange failed", error.status);

      return NextResponse.redirect(
        new URL("/login?error=oauth", url.origin)
      );
    }

    return NextResponse.redirect(
      new URL(destination, url.origin)
    );
  } catch (error) {
    console.error(
      "[AUTH CALLBACK] Unexpected error",
      error instanceof Error ? error.name : "UnknownError"
    );

    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin)
    );
  }
}
