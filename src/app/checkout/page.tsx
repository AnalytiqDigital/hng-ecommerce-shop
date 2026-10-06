"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { useStoreSettings } from "@/components/store-settings-provider";

const money = (cents: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

export default function CheckoutPage() {
  const { lines, hydrated, syncError } = useCart();
  const { settings } = useStoreSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const subtotal = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const shipping = subtotal >= settings.freeShippingThresholdCents ? 0 : settings.shippingFeeCents;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      customer: { fullName: form.get("fullName"), email: form.get("email"), phone: form.get("phone") },
      shippingAddress: { addressLine1: form.get("addressLine1"), addressLine2: form.get("addressLine2"), city: form.get("city"), state: form.get("state"), country: form.get("country"), postalCode: form.get("postalCode") },
      items: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    };
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Unable to start payment.");
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
      setBusy(false);
    }
  }

  if (!hydrated) return <main aria-busy="true" className="grid min-h-[70vh] place-items-center"><LoaderCircle className="animate-spin text-muted" size={22} /></main>;
  if (lines.length === 0) return <main className="mx-auto min-h-[70vh] max-w-[800px] px-5 py-20 text-center"><h1 className="font-display text-4xl">Your bag is empty.</h1><Link href="/shop" className="mt-6 inline-flex text-sm underline">Return to the shop</Link></main>;

  return <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><Link href="/cart" className="mb-7 inline-flex items-center gap-2 text-[11px] text-muted"><ArrowLeft size={14} /> Return to bag</Link><h1 className="font-display text-[42px]">A few details.</h1><p className="mt-2 text-[13px] text-muted">Your payment will be securely completed with Paystack.</p><div className="mt-9 grid gap-10 lg:grid-cols-[1fr_340px]">  <form onSubmit={submit} className="space-y-8">{syncError && <p role="alert" className="bg-[#f4e5df] p-3 text-[12px] text-clay">{syncError}</p>}<section><h2 className="mb-4 border-b border-line pb-3 text-[10px] uppercase tracking-[0.16em]">Contact details</h2><div className="grid gap-4 sm:grid-cols-2"><Field name="fullName" label="Full name" autoComplete="name" /><Field name="email" label="Email address" type="email" autoComplete="email" /><Field name="phone" label="Phone number" type="tel" autoComplete="tel" /></div></section><section><h2 className="mb-4 border-b border-line pb-3 text-[10px] uppercase tracking-[0.16em]">Delivery address</h2><div className="grid gap-4 sm:grid-cols-2"><Field name="addressLine1" label="Street address" autoComplete="address-line1" /><Field name="addressLine2" label="Apartment, suite (optional)" required={false} autoComplete="address-line2" /><Field name="city" label="City" autoComplete="address-level2" /><Field name="state" label="State" autoComplete="address-level1" /><Field name="country" label="Country" autoComplete="country-name" /><Field name="postalCode" label="Postal code" required={false} autoComplete="postal-code" /></div></section>{error && <p role="alert" className="bg-[#f4e5df] p-3 text-[12px] text-clay">{error}</p>}<button disabled={busy} className="flex h-12 w-full items-center justify-center gap-3 bg-forest text-[10px] uppercase tracking-[0.15em] text-white hover:bg-[#24372b] disabled:opacity-60 sm:w-[280px]">{busy && <LoaderCircle size={15} className="animate-spin" />}Continue to Paystack</button></form><aside className="h-fit bg-[#eeede7] p-5 sm:p-6"><h2 className="font-display text-[23px]">Your order</h2><div className="mt-5 space-y-4">{lines.map((line) => <div key={line.id} className="flex gap-3"><div className="relative size-[58px] shrink-0 overflow-hidden bg-[#deddd5]"><Image src={line.imageUrl} alt="" fill unoptimized sizes="58px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate text-[12px]">{line.name}</p><p className="mt-1 text-[10px] text-muted">Qty {line.quantity}</p></div><span className="text-[11px]">{money(line.priceCents * line.quantity, settings.currency)}</span></div>)}</div><div className="mt-5 border-t border-line pt-4"><div className="flex justify-between text-[12px]"><span>Subtotal</span><span>{money(subtotal, settings.currency)}</span></div><div className="mt-3 flex justify-between text-[12px] text-muted"><span>Shipping</span><span>{shipping === 0 ? "Complimentary" : money(shipping, settings.currency)}</span></div><div className="mt-4 flex justify-between border-t border-line pt-4 text-[13px] font-medium"><span>Total</span><span>{money(subtotal + shipping, settings.currency)}</span></div></div></aside></div></main>;
}

function Field({ name, label, type = "text", required = true, autoComplete }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string }) {
  return <label className="block text-[11px] text-muted">{label}<input name={name} type={type} autoComplete={autoComplete} required={required} className="mt-2 h-11 w-full border border-line bg-transparent px-3 text-[13px] text-ink outline-none focus:border-forest" /></label>;
}