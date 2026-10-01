"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type CategoryOption = { id: string; name: string };

export function ProductCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  async function uploadImage(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.set("file", file);
    try {
      const response = await fetch("/api/admin/storage", { method: "POST", body: formData });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Image upload failed.");
      setImageUrl(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const payload = { name, slug: String(form.get("slug")), description: String(form.get("description")), shortDescription: String(form.get("description")).slice(0, 300), priceCents: Math.round(Number(form.get("price")) * 100), sku: String(form.get("sku")), stockQuantity: Number(form.get("stock")), categoryId: String(form.get("categoryId")) || null, imageUrl: imageUrl || String(form.get("imageUrl")), featured: false, status: "published" };
    try {
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Product could not be saved.");
      formElement.reset();
      setImageUrl("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Product could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="mt-6 grid gap-3 border border-line bg-paper p-4 sm:grid-cols-2 sm:p-5"><label className="text-[10px] text-muted">Product name<input name="name" required minLength={2} className="admin-input" /></label><label className="text-[10px] text-muted">URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="admin-input" /></label><label className="text-[10px] text-muted">Price (NGN)<input name="price" type="number" min="1" step="1" required className="admin-input" /></label><label className="text-[10px] text-muted">SKU<input name="sku" required className="admin-input" /></label><label className="text-[10px] text-muted">Stock quantity<input name="stock" type="number" min="0" step="1" required className="admin-input" /></label><label className="text-[10px] text-muted">Category<select name="categoryId" className="admin-input"><option value="">Uncategorised</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-[10px] text-muted sm:col-span-2">Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImage(event.target.files?.[0])} className="admin-input file:mr-3 file:border-0 file:bg-forest file:px-3 file:py-2 file:text-[10px] file:text-white" />{uploading && <span className="mt-1 block text-[10px]">Uploading image…</span>}{imageUrl && <span className="mt-1 block text-[10px] text-forest">Image uploaded to storage.</span>}<span className="mt-2 block text-[10px]">Or paste an HTTPS image URL<input name="imageUrl" type="url" pattern="https://.*" required={!imageUrl} className="admin-input" /></span></label><label className="text-[10px] text-muted sm:col-span-2">Description<textarea name="description" required minLength={10} rows={3} className="admin-input h-auto py-3" /></label>{error && <p role="alert" className="text-[11px] text-clay sm:col-span-2">{error}</p>}<button disabled={busy || uploading} className="h-10 bg-forest px-5 text-[10px] uppercase tracking-[0.12em] text-white disabled:opacity-60 sm:col-span-2 sm:w-fit">{busy ? "Saving…" : "Publish product"}</button></form>;
}