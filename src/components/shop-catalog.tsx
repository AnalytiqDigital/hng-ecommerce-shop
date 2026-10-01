"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";

const money = (cents: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

function ShopProductCard({ product, currency }: { product: CatalogProduct; currency: string }) {
  const { add } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants.find((variant) => variant.stockQuantity > 0)?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const canAdd = product.variants.length ? Boolean(selectedVariant && selectedVariant.stockQuantity > 0) : product.stockQuantity > 0;

  return <article className="product-card group border border-line bg-paper p-2.5 sm:p-3"><Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-[#e8e5dc]"><Image src={product.imageUrl} alt={product.name} fill unoptimized sizes="(max-width: 640px) 48vw, 25vw" className="product-image object-cover" /></Link><div className="flex items-start justify-between gap-2 pt-3"><div className="min-w-0"><p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">{product.category}</p><Link href={`/products/${product.slug}`} className="block truncate text-[13px] font-medium">{product.name}</Link><p className="mt-1.5 text-[12px]">{money(product.priceCents, currency)}</p>{product.variants.length > 0 && <div className="mt-2 flex items-center gap-1.5">{product.variants.map((variant) => <button key={variant.id} type="button" title={variant.name} aria-label={`${product.name}, ${variant.name}${variant.stockQuantity < 1 ? ", out of stock" : ""}`} aria-pressed={selectedVariantId === variant.id} disabled={variant.stockQuantity < 1} onClick={() => setSelectedVariantId(variant.id)} className={`grid size-5 place-items-center rounded-full border disabled:opacity-35 ${selectedVariantId === variant.id ? "border-ink" : "border-transparent"}`}><span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex }} /></button>)}</div>}</div><button onClick={() => add(product, selectedVariant)} aria-label={`Add ${product.name}${selectedVariant ? ` in ${selectedVariant.name}` : ""} to bag`} disabled={!canAdd} className="grid size-9 shrink-0 place-items-center border border-line hover:bg-forest hover:text-white disabled:opacity-40"><ShoppingBag size={15} /></button></div></article>;
}

export function ShopCatalog({ products, currency }: { products: CatalogProduct[]; currency: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const items = useMemo(() => products.filter((product) => {
    const categoryMatch = category === "All" || category === product.category;
    const queryMatch = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  }).sort((a, b) => sort === "price-low" ? a.priceCents - b.priceCents : sort === "price-high" ? b.priceCents - a.priceCents : Number(b.featured) - Number(a.featured)), [products, category, query, sort]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-clay">Form & Field / Shop</p>
      <h1 className="font-display text-[42px] sm:text-[54px]">The whole collection</h1>
      <p className="mt-3 max-w-lg text-[13px] leading-6 text-muted">Useful things, chosen with care. Find your next everyday favourite.</p>
      <div className="mt-9 flex flex-col gap-4 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-10 items-center gap-2 border-b border-line sm:w-[260px]"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects" aria-label="Search objects" className="w-full bg-transparent text-xs outline-none" /></label>
        <div className="flex flex-wrap items-center gap-3"><div className="flex gap-4 overflow-x-auto text-[11px]">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "text-ink underline underline-offset-4" : "text-muted"}>{item}</button>)}</div><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="border-0 bg-transparent text-[11px] outline-none"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div>
      </div>
      <p className="mb-4 mt-6 text-[10px] text-muted">{items.length} pieces</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{items.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} />)}</div>
      {items.length === 0 && <p className="py-16 text-center text-sm text-muted">No objects found. Try another search.</p>}
    </main>
  );
}