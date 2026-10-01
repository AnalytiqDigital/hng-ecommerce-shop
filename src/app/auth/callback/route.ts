```ts
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

  console.log("[AUTH CALLBACK] Started");

  if (!code) {
    console.log("[AUTH CALLBACK] No OAuth code received");

    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin),
    );
  }

  console.log("[AUTH CALLBACK] OAuth code received");

  try {
    const supabase = await createSupabaseServerClient();

    console.log("[AUTH CALLBACK] Exchanging code for session");

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(
        "[AUTH CALLBACK] OAuth exchange error:",
        error.message,
      );

      return NextResponse.redirect(
        new URL("/login?error=oauth", url.origin),
      );
    }

    console.log(
      "[AUTH CALLBACK] Session exchange successful",
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log(
      "[AUTH CALLBACK] User:",
      user?.email ?? "NO USER",
    );

    console.log(
      "[AUTH CALLBACK] Profile database write SKIPPED",
    );

    console.log(
      "[AUTH CALLBACK] Redirecting to:",
      destination,
    );

    return NextResponse.redirect(
      new URL(destination, url.origin),
    );
  } catch (error) {
    console.error(
      "[AUTH CALLBACK] Unexpected error:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin),
    );
  }
}
```
