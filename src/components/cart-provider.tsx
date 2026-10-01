"use client";

import { createContext, startTransition, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";

export type CartLine = Pick<CatalogProduct, "slug" | "name" | "priceCents"> & {
  id: string;
  productId: string;
  imageUrl: string;
  stockQuantity: number;
  variantId?: string;
  variantName?: string;
  variantColorHex?: string;
  variantSku?: string;
  quantity: number;
};
type CartContextValue = {
  lines: CartLine[];
  count: number;
  hydrated: boolean;
  add: (product: CatalogProduct, variant?: CatalogVariant) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "form-field-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydratedState, setHydratedState] = useState(false);
  const linesRef = useRef<CartLine[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const restored = saved ? (JSON.parse(saved) as Array<Partial<CartLine> & Pick<CartLine, "id" | "slug" | "name" | "priceCents" | "imageUrl" | "stockQuantity" | "quantity">>).map((line) => {
        const productId = line.productId ?? line.id;
        const variantId = line.variantId;
        return { ...line, productId, variantId, id: `${productId}:${variantId ?? "default"}` } as CartLine;
      }) : [];
      linesRef.current = restored;
      startTransition(() => {
        setLines(restored);
        setHydratedState(true);
      });
    } catch {
      window.localStorage.removeItem(storageKey);
      startTransition(() => setHydratedState(true));
    }
    hydrated.current = true;
  }, []);

  function commit(next: CartLine[]) {
    linesRef.current = next;
    setLines(next);
    if (hydrated.current) window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const value: CartContextValue = {
    lines,
    count: lines.reduce((total, line) => total + line.quantity, 0),
    hydrated: hydratedState,
    add: (product, variant) => {
      const current = linesRef.current;
      const lineId = `${product.id}:${variant?.id ?? "default"}`;
      const found = current.find((line) => line.id === lineId);
      const variantStock = variant?.stockQuantity ?? product.stockQuantity;
      const next = found
        ? current.map((line) => line.id === lineId ? { ...line, quantity: Math.min(line.quantity + 1, variantStock) } : line)
        : [...current, {
          id: lineId,
          productId: product.id,
          slug: product.slug,
          name: variant ? `${product.name} · ${variant.name}` : product.name,
          priceCents: product.priceCents,
          imageUrl: variant?.imageUrl ?? product.imageUrl,
          stockQuantity: variantStock,
          variantId: variant?.id,
          variantName: variant?.name,
          variantColorHex: variant?.colorHex,
          variantSku: variant?.sku,
          quantity: 1,
        }];
      commit(next);
    },
    setQuantity: (id, quantity) => commit(linesRef.current.map((line) => line.id === id ? { ...line, quantity: Math.max(1, Math.min(quantity, line.stockQuantity)) } : line)),
    remove: (id) => commit(linesRef.current.filter((line) => line.id !== id)),
    clear: () => commit([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}