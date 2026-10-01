import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductPurchase } from "@/components/product-purchase";
import { getProductBySlug } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/store-settings.server";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Object not found | Form & Field" };
  const title = `${product.name} | Form & Field`;
  return {
    title,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description: product.description, images: [{ url: product.imageUrl, alt: product.name }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);
  if (!product) notFound();

  return <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><p className="mb-7 text-[10px] text-muted"><Link href="/shop">Shop</Link> / {product.category} / {product.name}</p><div className="grid gap-8 lg:grid-cols-2 lg:gap-16"><div className="relative aspect-[4/5] overflow-hidden bg-[#e8e5dc]"><Image src={product.imageUrl} alt={product.name} fill priority unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div><div className="flex flex-col justify-center py-4 lg:py-12"><p className="text-[10px] uppercase tracking-[0.18em] text-clay">{product.category}</p><h1 className="mt-3 font-display text-[42px] leading-tight sm:text-[54px]">{product.name}</h1><p className="mt-5 text-[18px]">{new Intl.NumberFormat("en", { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(product.priceCents / 100)}</p><p className="mt-7 max-w-[460px] text-[14px] leading-7 text-muted">{product.description}</p><p className="mt-7 text-[11px]">{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}</p><ProductPurchase product={product} /><div className="mt-10 border-t border-line pt-5 text-[11px] leading-6 text-muted"><p>Thoughtfully sourced and carefully packed.</p><p>{settings.announcement}</p></div></div></div></main>;
}