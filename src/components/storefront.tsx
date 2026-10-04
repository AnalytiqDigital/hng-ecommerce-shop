"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Check, Menu, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/store-settings";

const categories = ["All objects", "Home", "Accessories", "Lighting", "Clothing"];
const formatPrice = (cents: number, currency: StoreSettings["currency"]) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

function ProductCard({ product, index, currency }: { product: CatalogProduct; index: number; currency: StoreSettings["currency"] }) {
  const { add, hydrated } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants.find((variant) => variant.stockQuantity > 0)?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const canAdd = product.variants.length ? Boolean(selectedVariant && selectedVariant.stockQuantity > 0) : product.stockQuantity > 0;
  function addToCart() {
    add(product, selectedVariant);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }
  return (
    <article className="product-card arrive group min-w-0 border border-line bg-paper p-2.5 sm:p-3" style={{ animationDelay: `${index * 70}ms` }}>
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-[#e8e5dc]">
        <Image src={product.imageUrl} alt={product.name} fill unoptimized sizes="(max-width: 640px) 48vw, (max-width: 1100px) 30vw, 22vw" className="product-image object-cover" />
        {product.compareAtPriceCents && <span className="absolute left-3 top-3 bg-paper px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]">A considered find</span>}
      </Link>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">{product.category}</p>
          <Link href={`/products/${product.slug}`} className="block truncate text-[14px] font-medium hover:text-forest">{product.name}</Link>
          <p className="mt-1.5 text-[13px]">{formatPrice(product.priceCents, currency)}</p>
          {product.variants.length > 0 && <div className="mt-2 flex items-center gap-1.5">{product.variants.map((variant) => <button key={variant.id} type="button" title={variant.name} aria-label={`${product.name}, ${variant.name}${variant.stockQuantity < 1 ? ", out of stock" : ""}`} aria-pressed={selectedVariantId === variant.id} disabled={variant.stockQuantity < 1} onClick={() => { setSelectedVariantId(variant.id); setAdded(false); }} className={`grid size-5 place-items-center rounded-full border disabled:opacity-35 ${selectedVariantId === variant.id ? "border-ink" : "border-transparent"}`}><span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex }} /></button>)}</div>}
        </div>
        <button aria-label={`Add ${product.name}${selectedVariant ? ` in ${selectedVariant.name}` : ""} to bag`} onClick={addToCart} disabled={!hydrated || !canAdd} className="mt-1 grid size-9 shrink-0 place-items-center border border-line text-ink transition-colors hover:border-forest hover:bg-forest hover:text-white disabled:opacity-40">
          {added ? <Check size={16} /> : <ShoppingBag size={16} strokeWidth={1.6} />}
        </button>
      </div>
    </article>
  );
}

export function Storefront({ products, settings, welcomeName }: { products: CatalogProduct[]; settings: StoreSettings; welcomeName: string | null }) {
  const [activeCategory, setActiveCategory] = useState("All objects");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const { count } = useCart();
  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatches = activeCategory === "All objects" || product.category === activeCategory;
    const query = search.trim().toLowerCase();
    return categoryMatches && (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query));
  }), [products, activeCategory, search]);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) });
    const result = await response.json() as { subscribed?: boolean; error?: string };
    setNewsletterMessage(response.ok ? "You're on the list. Look out for a note from us." : result.error ?? "Please try again shortly.");
    if (response.ok) formElement.reset();
  }

  return (
    <main>
      <div className="flex min-h-8 items-center justify-center bg-forest px-4 py-1 text-center text-[10px] uppercase tracking-[0.17em] text-white">{settings.announcement}</div>
      <header className="relative z-20 border-b border-line bg-paper">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button className="grid size-10 place-items-center lg:hidden" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
          <nav className="hidden items-center gap-7 text-[12px] lg:flex"><Link href="/" className="hover:text-clay">Home</Link><Link href="/shop" className="hover:text-clay">Shop</Link><a href="#story" className="hover:text-clay">Our point of view</a><a href="#newsletter" className="hover:text-clay">Journal</a><Link href="/download" className="hover:text-clay">Get the app</Link></nav>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-center">{settings.logoUrl ? <span className="relative mx-auto block h-8 w-36"><Image src={settings.logoUrl} alt={settings.storeName} fill unoptimized sizes="144px" className="object-contain" /></span> : <span className="block whitespace-nowrap font-display text-[24px] leading-none tracking-[0.01em]">{settings.storeName}</span>}<span className="mt-1 block text-[8px] uppercase tracking-[0.2em] text-muted">{settings.tagline}</span></Link>
          <div className="flex items-center gap-1 sm:gap-3"><label className="hidden h-9 items-center gap-2 border-b border-line px-2 sm:flex"><Search size={15} strokeWidth={1.5} /><input aria-label="Search products" value={search} onChange={(event) => { setSearch(event.target.value); document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }); }} placeholder="Search" className="w-20 bg-transparent text-xs outline-none placeholder:text-muted" /></label><Link href="/account" className="grid size-10 place-items-center transition-colors hover:text-clay" aria-label="Account"><UserRound size={19} strokeWidth={1.5} /></Link><Link href="/cart" className="relative grid size-10 place-items-center" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={19} strokeWidth={1.5} />{count > 0 && <span className="absolute right-0 top-0 grid size-[17px] place-items-center rounded-full bg-clay text-[9px] text-white">{count}</span>}</Link></div>
        </div>
        {mobileMenu && <nav className="absolute left-0 right-0 top-full flex flex-col gap-5 border-b border-line bg-paper px-6 py-6 text-sm shadow-sm lg:hidden"><Link href="/" onClick={() => setMobileMenu(false)}>Home</Link><Link href="/shop" onClick={() => setMobileMenu(false)}>Shop</Link><a href="#story" onClick={() => setMobileMenu(false)}>Our point of view</a><a href="#newsletter" onClick={() => setMobileMenu(false)}>Journal</a><Link href="/account" onClick={() => setMobileMenu(false)}>Account</Link><Link href="/download" onClick={() => setMobileMenu(false)}>Get the Android app</Link></nav>}
      </header>
      <div className="mx-auto flex min-h-10 max-w-[1440px] items-center justify-between gap-3 border-b border-line px-5 py-2 sm:px-8 lg:px-12"><p className="truncate text-[11px] text-muted"><span className="font-medium text-ink">{welcomeName ? `Welcome, ${welcomeName}.` : `Welcome to ${settings.storeName}.`}</span><span className="ml-1 hidden sm:inline">A thoughtful collection for everyday living.</span></p><Link href="/account" className="shrink-0 text-[10px] underline underline-offset-4 lg:hidden">Your account</Link></div>

      <section className="relative mx-auto min-h-[560px] max-w-[1440px] overflow-hidden bg-[#d9d7cc] sm:min-h-[620px] lg:min-h-[690px]">
        <Image src={settings.heroImageUrl} alt="Featured collection" fill priority unoptimized sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#20251f]/60 via-[#20251f]/20 to-transparent" />
        <div className="relative flex min-h-[560px] flex-col justify-end px-6 pb-12 text-white sm:min-h-[620px] sm:px-12 sm:pb-16 lg:min-h-[690px] lg:px-20 lg:pb-20">
          <p className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"><Sparkles size={13} /> {settings.heroEyebrow}</p>
          <h1 className="max-w-[720px] font-display text-[48px] leading-[1.03] sm:text-[68px] lg:text-[84px]">{settings.heroTitle}<br /><i className="font-normal">{settings.heroAccent}</i></h1>
          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-[330px] text-[14px] leading-6 text-white/85">{settings.heroBody}</p><a href="#collection" className="flex w-fit items-center gap-3 border-b border-white/70 pb-2 text-[11px] uppercase tracking-[0.15em]">Explore the collection <ArrowDownRight size={16} /></a></div>
        </div>
        <span className="absolute bottom-8 right-8 hidden text-[9px] uppercase tracking-[0.2em] text-white/80 lg:block">01 / 03 &nbsp; Home as a feeling</span>
      </section>

      <section id="collection" className="scroll-mt-4 mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:mb-10 sm:flex-row sm:items-end"><div><p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-clay">{settings.collectionEyebrow}</p><h2 className="font-display text-[36px] leading-tight sm:text-[44px]">{settings.collectionTitle}</h2></div><p className="max-w-[320px] text-[13px] leading-6 text-muted">{settings.collectionBody}</p></div>
        <div className="mb-7 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-5 overflow-x-auto whitespace-nowrap text-[11px]">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`pb-1 ${activeCategory === category ? "border-b border-ink text-ink" : "text-muted hover:text-ink"}`}>{category}</button>)}</div><label className="flex h-9 items-center gap-2 border-b border-line px-1 sm:hidden"><Search size={15} /><input aria-label="Search collection" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" className="w-full bg-transparent text-xs outline-none placeholder:text-muted" /></label><span className="hidden text-[10px] text-muted sm:block">{visibleProducts.length} pieces</span></div>
        {visibleProducts.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} currency={settings.currency} />)}</div> : <div className="py-20 text-center text-sm text-muted">Nothing in this edit matches that search.</div>}
        <div className="mt-12 flex justify-center"><Link href="/shop" className="flex h-11 items-center gap-3 border border-ink px-5 text-[10px] uppercase tracking-[0.15em] transition-colors hover:bg-ink hover:text-white">View all objects <ArrowRight size={14} /></Link></div>
      </section>

      <section id="story" className="border-y border-line bg-[#e9e9e1]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12"><div className="relative min-h-[380px] lg:col-span-7 lg:min-h-[570px]"><Image src={settings.aboutImageUrl} alt="Objects from the store" fill unoptimized sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" /></div><div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:col-span-5 lg:px-16"><p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-clay">{settings.aboutEyebrow}</p><h2 className="font-display text-[38px] leading-[1.12] sm:text-[48px]">{settings.aboutTitle}<br /><i className="font-normal">{settings.aboutAccent}</i></h2><p className="mt-6 max-w-[390px] text-[13px] leading-6 text-muted">{settings.aboutBody}</p><a href="#newsletter" className="mt-8 flex w-fit items-center gap-3 border-b border-ink pb-2 text-[10px] uppercase tracking-[0.14em]">A little more about us <ArrowRight size={14} /></a></div></div>
      </section>

      <section id="newsletter" className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-12"><div><p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-clay">A note, now and then</p><h2 className="font-display text-[34px] sm:text-[42px]">{settings.newsletterTitle}</h2><p className="mt-3 text-[13px] text-muted">{settings.newsletterBody}</p></div><form className="w-full max-w-[440px]" onSubmit={subscribe}><div className="flex border-b border-ink pb-3"><input name="email" required type="email" aria-label="Email address" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted" /><button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.13em]">Sign me up <ArrowRight size={14} /></button></div>{newsletterMessage && <p role="status" className="mt-2 text-[11px] text-muted">{newsletterMessage}</p>}</form></section>

      <footer className="bg-[#26352b] text-white"><div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-10 px-5 py-12 sm:px-8 lg:grid-cols-4 lg:px-12"><div className="col-span-2"><Link href="/" className="font-display text-[26px]">{settings.storeName}</Link><p className="mt-4 max-w-[280px] text-[12px] leading-5 text-white/65">{settings.footerText}</p></div><div><p className="mb-4 text-[9px] uppercase tracking-[0.18em] text-white/50">Explore</p><div className="flex flex-col gap-3 text-[12px] text-white/80"><a href="#collection">Shop all</a><a href="#story">Our story</a><Link href="/account">My account</Link><Link href="/download">Get the Android app</Link></div></div><div><p className="mb-4 text-[9px] uppercase tracking-[0.18em] text-white/50">Need a hand?</p><div className="flex flex-col gap-3 text-[12px] text-white/80"><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>{settings.contactPhone && <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>}{settings.contactAddress && <span>{settings.contactAddress}</span>}<Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div><div className="col-span-2 border-t border-white/15 pt-5 text-[10px] text-white/45">© 2026 {settings.storeName}. Considered by design.</div></div></footer>
    </main>
  );
}