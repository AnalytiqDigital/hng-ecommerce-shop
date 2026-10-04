import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, Check, ShieldCheck, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get the Android app | Form & Field",
  description: "Install the Form & Field shopping app on your Android phone.",
};

export default function DownloadPage() {
  const apkUrl = process.env.ANDROID_APK_URL;

  return (
    <main className="min-h-[75vh] bg-paper px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/" className="inline-flex items-center gap-2 text-[11px] text-muted hover:text-ink">
          <ArrowLeft size={14} /> Back to the store
        </Link>

        <section className="mt-8 grid overflow-hidden border border-line bg-[#e9e9e1] md:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-[9px] uppercase tracking-[0.2em] text-clay">FORM & FIELD FOR ANDROID</p>
            <h1 className="mt-4 max-w-[520px] font-display text-[42px] leading-[1.08] sm:text-[56px]">
              Good things, closer to home.
            </h1>
            <p className="mt-5 max-w-[430px] text-[13px] leading-6 text-muted">
              Shop the considered collection, save your bag, and keep your account
              close with the Form & Field Android app.
            </p>

            {apkUrl ? (
              <a
                href={apkUrl}
                className="mt-8 inline-flex min-h-12 items-center gap-3 bg-forest px-5 text-[10px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#24372b]"
              >
                <ArrowDownToLine size={16} />
                Download Android APK
              </a>
            ) : (
              <div className="mt-8 inline-flex min-h-12 items-center gap-3 border border-forest/30 bg-white/50 px-5 text-[10px] uppercase tracking-[0.12em] text-forest">
                <Smartphone size={16} />
                Android download coming soon
              </div>
            )}

            <p className="mt-4 max-w-[410px] text-[10px] leading-5 text-muted">
              {apkUrl
                ? "Download the APK on your Android phone, open the file, and approve installation if Android asks."
                : "The install file will appear here after the signed Android APK is built and published."}
            </p>
          </div>

          <div className="flex flex-col justify-center bg-[#344b3b] px-6 py-9 text-white sm:px-10">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/55">MADE FOR YOUR EVERYDAY</p>
            <div className="mt-7 space-y-5">
              {[
                "Browse the full collection and choose product options.",
                "Keep your cart saved between visits.",
                "Sign in with the same account you use on the website.",
                "Check out securely with Paystack.",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#d8b59c]" />
                  <span className="text-[12px] leading-5 text-white/85">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-[10px] text-white/60">
              <ShieldCheck size={14} />
              Sign in securely using your Form & Field account
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-clay">01 · INSTALL</p>
            <p className="mt-2 text-[12px] leading-5 text-muted">Download and open the APK on your Android device.</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-clay">02 · SIGN IN</p>
            <p className="mt-2 text-[12px] leading-5 text-muted">Use your existing website login or create an account.</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-clay">03 · EXPLORE</p>
            <p className="mt-2 text-[12px] leading-5 text-muted">Test product options, cart, checkout, and account on your phone.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
