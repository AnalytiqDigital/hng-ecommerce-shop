"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const options = ["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function update(next: string) {
    setError("");
    const response = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to update status.");
    else router.refresh();
  }
  return <div><select aria-label="Update order status" defaultValue={status} onChange={(event) => update(event.target.value)} className="border border-line bg-paper px-2 py-2 text-[10px] capitalize"><option value={status}>{status}</option>{options.filter((option) => option !== status).map((option) => <option key={option} value={option}>{option}</option>)}</select>{error && <p className="mt-1 max-w-[150px] text-[9px] text-clay">{error}</p>}</div>;
}