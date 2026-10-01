"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start Google sign-in.");
      setLoading(false);
    }
  }

  return <main className="grid min-h-[75vh] place-items-center px-5 py-16"><section className="w-full max-w-[420px]"><Link href="/" className="mb-10 inline-flex items-center gap-2 text-[11px] text-muted"><ArrowLeft size={14} /> Back to the shop</Link><p className="text-[10px] uppercase tracking-[0.18em] text-clay">Your account</p><h1 className="mt-3 font-display text-[42px]">Welcome back.</h1><p className="mt-3 text-[13px] leading-6 text-muted">Sign in to see your orders and keep your everyday favourites close.</p><button onClick={signInWithGoogle} disabled={loading} className="mt-8 flex h-12 w-full items-center justify-center gap-3 border border-ink text-[11px] uppercase tracking-[0.12em] hover:bg-ink hover:text-white disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <span className="text-[15px] font-semibold normal-case">G</span>} Continue with Google</button>{error && <p role="alert" className="mt-4 text-[12px] text-clay">{error}</p>}<p className="mt-6 text-[10px] leading-5 text-muted">By continuing, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p></section></main>;
}