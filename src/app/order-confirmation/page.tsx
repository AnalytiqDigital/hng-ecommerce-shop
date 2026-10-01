"use client";

import Link from "next/link";
import { Check, Clock3, LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";

type PaymentState = { orderNumber?: string; status?: string; paymentStatus?: string; error?: string };

function ConfirmationContent() {
  const search = useSearchParams();
  const reference = search.get("reference") ?? "";
  const [state, setState] = useState<PaymentState>({});
  const [attempt, setAttempt] = useState(0);
  const { clear, hydrated } = useCart();

  useEffect(() => {
    if (!reference || !hydrated || attempt >= 40 || state.paymentStatus === "paid") return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/orders/payment/${encodeURIComponent(reference)}`, { cache: "no-store" });
        const result = await response.json() as PaymentState;
        if (active && response.ok) {
          setState(result);
          if (result.paymentStatus === "paid") clear();
        }
      } catch {
        if (active) setState((current) => ({ ...current, error: "We are still checking the payment." }));
      }
      if (active) setAttempt((current) => current + 1);
    }, 1800);
    return () => { active = false; window.clearTimeout(timer); };
  }, [reference, attempt, state.paymentStatus, clear, hydrated]);

  const paid = state.paymentStatus === "paid";
  return <main className="mx-auto grid min-h-[75vh] max-w-[700px] place-items-center px-5 py-16 text-center"><section><div className={`mx-auto grid size-14 place-items-center rounded-full ${paid ? "bg-[#dce8dc] text-forest" : "bg-[#ece9df] text-clay"}`}>{paid ? <Check size={23} /> : state.paymentStatus === "failed" ? <Clock3 size={22} /> : <LoaderCircle size={22} className="animate-spin" />}</div><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-clay">{paid ? "Payment confirmed" : "Payment verification"}</p><h1 className="mt-3 font-display text-[38px] sm:text-[48px]">{paid ? "Thank you. It is yours." : state.paymentStatus === "failed" ? "Payment not confirmed." : "We are checking with Paystack."}</h1><p className="mx-auto mt-4 max-w-[440px] text-[13px] leading-6 text-muted">{paid ? "Your order is confirmed. A receipt is on its way to your inbox." : state.paymentStatus === "failed" ? "No order confirmation has been received. Please contact us before attempting another payment." : "This page updates when Paystack confirms the transaction. Please keep this page open for a moment."}</p>{state.orderNumber && <p className="mt-5 text-[11px]">Order reference <strong>{state.orderNumber}</strong></p>}{state.error && !paid && <p role="status" className="mt-4 text-[11px] text-muted">{state.error}</p>}<div className="mt-8 flex justify-center gap-3"><Link href="/shop" className="flex h-11 items-center bg-forest px-5 text-[10px] uppercase tracking-[0.13em] text-white">Return to the shop</Link><Link href="/account" className="flex h-11 items-center border border-ink px-5 text-[10px] uppercase tracking-[0.13em]">My orders</Link></div></section></main>;
}

export default function OrderConfirmationPage() {
  return <Suspense fallback={<main className="grid min-h-[70vh] place-items-center"><LoaderCircle className="animate-spin" /></main>}><ConfirmationContent /></Suspense>;
}