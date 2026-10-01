"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductPurchase({ product }: { product: CatalogProduct }) {
  const { add, hydrated } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants.find((variant) => variant.stockQuantity > 0)?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const canAdd = product.variants.length ? Boolean(selectedVariant && selectedVariant.stockQuantity > 0) : product.stockQuantity > 0;

  return <div className="mt-8">
    {product.variants.length > 0 && <fieldset>
      <legend className="mb-3 text-[11px]">Colour <span className="text-muted">/ {selectedVariant?.name ?? "Choose a colour"}</span></legend>
      <div className="flex flex-wrap gap-2.5">{product.variants.map((variant) => <button key={variant.id} type="button" disabled={variant.stockQuantity < 1} onClick={() => { setSelectedVariantId(variant.id); setAdded(false); }} aria-label={`${variant.name}${variant.stockQuantity < 1 ? " (out of stock)" : ""}`} aria-pressed={selectedVariantId === variant.id} title={`${variant.name}${variant.stockQuantity < 1 ? " · out of stock" : ""}`} className={`grid size-9 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 ${selectedVariantId === variant.id ? "border-ink ring-1 ring-ink ring-offset-2" : "border-transparent hover:border-ink/40"}`}><span className="size-6 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex }} /></button>)}</div>
      {selectedVariant && <p className="mt-3 text-[10px] text-muted">{selectedVariant.stockQuantity} available in {selectedVariant.name}</p>}
    </fieldset>}
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={!hydrated || !canAdd} onClick={() => { add(product, selectedVariant); setAdded(true); }} className="flex h-12 min-w-[190px] items-center justify-center gap-3 bg-forest px-6 text-[10px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#24372b] disabled:cursor-not-allowed disabled:bg-muted">{added ? <><Check size={15} /> Added to bag</> : <><ShoppingBag size={15} /> Add to bag</>}</button>{added && <Link href="/cart" className="flex h-12 items-center border border-ink px-5 text-[10px] uppercase tracking-[0.12em]">View bag</Link>}</div>
  </div>;
}