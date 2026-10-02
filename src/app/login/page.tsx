"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function getNextPath() {
    const requestedNext = new URLSearchParams(window.location.search).get(
      "next"
    );

    return requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const next = getNextPath();

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });

      if (authError) throw authError;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to start Google sign-in."
      );
      setLoading(false);
    }
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();

      if (!email.trim() || !password) {
        throw new Error("Please enter your email and password.");
      }

      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (authError) throw authError;

        if (data.session) {
          window.location.href = getNextPath();
          return;
        }

        setMessage(
          "Account created. Please check your email to confirm your account before signing in."
        );
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;

        window.location.href = getNextPath();
        return;
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : mode === "signup"
            ? "Unable to create your account."
            : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === "signin" ? "signup" : "signin"));
    setError("");
    setMessage("");
  }

  return (
    <main className="grid min-h-[75vh] place-items-center px-5 py-16">
      <section className="w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-[11px] text-muted"
        >
          <ArrowLeft size={14} />
          Back to the shop
        </Link>

        <p className="text-[10px] uppercase tracking-[0.18em] text-clay">
          Your account
        </p>

        <h1 className="mt-3 font-display text-[42px]">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>

        <p className="mt-3 text-[13px] leading-6 text-muted">
          {mode === "signin"
            ? "Sign in to see your orders and keep your everyday favourites close."
            : "Create an account to track orders and make checkout easier."}
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 border border-ink text-[11px] uppercase tracking-[0.12em] hover:bg-ink hover:text-white disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <span className="text-[15px] font-semibold normal-case">G</span>
          )}
          Continue with Google
        </button>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
            Or
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="h-12 w-full border border-line bg-paper px-4 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="h-12 w-full border border-line bg-paper px-4 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 bg-ink text-[11px] uppercase tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-[12px] text-clay">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 text-[12px] leading-5 text-muted">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={switchMode}
          disabled={loading}
          className="mt-6 w-full text-center text-[11px] underline underline-offset-4 disabled:opacity-60"
        >
          {mode === "signin"
            ? "Don't have an account? Create one"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 text-[10px] leading-5 text-muted">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}