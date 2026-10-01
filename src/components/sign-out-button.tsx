"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return <button onClick={async () => { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); router.push("/"); router.refresh(); }} className="text-[10px] uppercase tracking-[0.12em] underline underline-offset-4">Sign out</button>;
}