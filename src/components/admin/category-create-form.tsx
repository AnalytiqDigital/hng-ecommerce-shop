"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CategoryCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug: String(form.get("slug")), description: String(form.get("description")) }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Category could not be created.");
    else { formElement.reset(); setError(""); router.refresh(); }
  }
  return <form onSubmit={submit} className="mt-6 grid gap-3 border border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end"><label className="text-[10px] text-muted">Name<input name="name" required minLength={2} className="admin-input" /></label><label className="text-[10px] text-muted">URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="admin-input" /></label><label className="text-[10px] text-muted">Description<input name="description" className="admin-input" /></label><button className="h-10 bg-forest px-4 text-[10px] uppercase tracking-[0.1em] text-white">Add category</button>{error && <p role="alert" className="text-[11px] text-clay sm:col-span-4">{error}</p>}</form>;
}