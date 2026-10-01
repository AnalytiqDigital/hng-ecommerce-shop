"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useStoreSettings } from "@/components/store-settings-provider";
import type { StoreSettings } from "@/lib/store-settings";

type InputKey = Exclude<keyof StoreSettings, "shippingFeeCents" | "freeShippingThresholdCents" | "currency">;
const contentFields: Array<{ key: InputKey; label: string; area?: boolean; type?: string }> = [
  { key: "storeName", label: "Store name" },
  { key: "tagline", label: "Short tagline" },
  { key: "logoUrl", label: "Logo image URL", type: "url" },
  { key: "announcement", label: "Announcement bar" },
  { key: "heroEyebrow", label: "Hero eyebrow" },
  { key: "heroTitle", label: "Hero heading" },
  { key: "heroAccent", label: "Hero accent line" },
  { key: "heroBody", label: "Hero supporting copy", area: true },
  { key: "heroImageUrl", label: "Hero image URL", type: "url" },
  { key: "collectionEyebrow", label: "Collection eyebrow" },
  { key: "collectionTitle", label: "Collection heading" },
  { key: "collectionBody", label: "Collection supporting copy", area: true },
  { key: "aboutEyebrow", label: "About eyebrow" },
  { key: "aboutTitle", label: "About heading" },
  { key: "aboutAccent", label: "About accent line" },
  { key: "aboutBody", label: "About copy", area: true },
  { key: "aboutImageUrl", label: "About image URL", type: "url" },
  { key: "newsletterTitle", label: "Newsletter heading" },
  { key: "newsletterBody", label: "Newsletter supporting copy", area: true },
  { key: "footerText", label: "Footer description", area: true },
  { key: "contactEmail", label: "Contact email", type: "email" },
  { key: "contactPhone", label: "Contact phone", type: "tel" },
  { key: "whatsappNumber", label: "WhatsApp number (include country code)" },
  { key: "contactAddress", label: "Store address" },
];

export function StoreSettingsForm({ initialSettings }: { initialSettings: StoreSettings }) {
  const { refresh } = useStoreSettings();
  const router = useRouter();
  const [values, setValues] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { settings?: StoreSettings; error?: string };
      if (!response.ok || !result.settings) throw new Error(result.error ?? "Unable to save store settings.");
      setValues(result.settings);
      await refresh();
      router.refresh();
      setMessage("Store settings saved. The storefront has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save store settings.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="space-y-9">
    <section><div className="mb-4 border-b border-line pb-3"><h2 className="font-display text-[23px]">Brand & homepage</h2><p className="mt-1 text-[11px] text-muted">These fields update the live storefront after saving.</p></div><div className="grid gap-4 sm:grid-cols-2">{contentFields.slice(0, 20).map((field) => <SettingsField key={field.key} field={field} value={values[field.key]} onChange={(value) => update(field.key, value as StoreSettings[typeof field.key])} wide={field.area || field.type === "url"} />)}</div></section>
    <section><div className="mb-4 border-b border-line pb-3"><h2 className="font-display text-[23px]">Store details</h2></div><div className="grid gap-4 sm:grid-cols-2">{contentFields.slice(20).map((field) => <SettingsField key={field.key} field={field} value={values[field.key]} onChange={(value) => update(field.key, value as StoreSettings[typeof field.key])} />)}<label className="text-[10px] text-muted">Currency<select value={values.currency} onChange={(event) => update("currency", event.target.value as StoreSettings["currency"])} className="admin-input"><option value="NGN">NGN / Nigerian naira</option><option value="GHS">GHS / Ghanaian cedi</option><option value="ZAR">ZAR / South African rand</option><option value="USD">USD / US dollar</option></select></label><AmountField label={`Shipping fee (${values.currency})`} value={values.shippingFeeCents} onChange={(value) => update("shippingFeeCents", value)} /><AmountField label={`Free shipping from (${values.currency})`} value={values.freeShippingThresholdCents} onChange={(value) => update("freeShippingThresholdCents", value)} /></div></section>
    {error && <p role="alert" className="bg-[#f4e5df] p-3 text-[12px] text-clay">{error}</p>}{message && <p role="status" className="bg-[#e4ece2] p-3 text-[12px] text-forest">{message}</p>}
    <button disabled={busy} className="flex h-11 items-center bg-forest px-6 text-[10px] uppercase tracking-[0.14em] text-white disabled:opacity-60">{busy ? "Saving changes…" : "Save store settings"}</button>
  </form>;
}

function SettingsField({ field, value, onChange, wide = false }: { field: (typeof contentFields)[number]; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return <label className={`text-[10px] text-muted ${wide ? "sm:col-span-2" : ""}`}>{field.label}{field.area ? <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input h-auto py-3" /> : <input type={field.type ?? "text"} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" />}</label>;
}

function AmountField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="text-[10px] text-muted">{label}<input type="number" min="0" step="1" value={value / 100} onChange={(event) => onChange(Math.round(Number(event.target.value || 0) * 100))} className="admin-input" /></label>;
}