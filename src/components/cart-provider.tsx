"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  syncError: string;
  add: (product: CatalogProduct, variant?: CatalogVariant) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "form-field-cart-v1";

function readLocalCart(): CartLine[] {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return [];
    return (JSON.parse(saved) as Array<Partial<CartLine> & Pick<CartLine, "id" | "slug" | "name" | "priceCents" | "imageUrl" | "stockQuantity" | "quantity">>).map((line) => {
      const productId = line.productId ?? line.id;
      const variantId = line.variantId;
      return { ...line, productId, variantId, id: `${productId}:${variantId ?? "default"}` } as CartLine;
    });
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

async function requestServerCart() {
  const response = await fetch("/api/cart", { cache: "no-store" });
  if (response.status === 401) return null;
  const result = await response.json() as { items?: CartLine[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Unable to sync your cart.");
  if (!Array.isArray(result.items)) throw new Error("The saved cart response was invalid.");
  return result.items;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydratedState, setHydratedState] = useState(false);
  const [syncError, setSyncError] = useState("");
  const linesRef = useRef<CartLine[]>([]);
  const hydrated = useRef(false);
  const serverSync = useRef(false);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  function applyLines(next: CartLine[]) {
    linesRef.current = next;
    setLines(next);
  }

  const refreshCart = useCallback(async () => {
    try {
      const remote = await requestServerCart();
      serverSync.current = remote !== null;
      applyLines(remote ?? readLocalCart());
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to sync your cart.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function hydrateCart() {
      try {
        const remote = await requestServerCart();
        if (!active) return;
        serverSync.current = remote !== null;
        const restored = remote ?? readLocalCart();
        linesRef.current = restored;
        startTransition(() => {
          setLines(restored);
          setHydratedState(true);
        });
        setSyncError("");
      } catch (error) {
        if (!active) return;
        const restored = readLocalCart();
        linesRef.current = restored;
        startTransition(() => {
          setLines(restored);
          setHydratedState(true);
        });
        setSyncError(error instanceof Error ? error.message : "Unable to sync your cart.");
      }
      hydrated.current = true;
    }

    void hydrateCart();
    const handleFocus = () => {
      if (hydrated.current) void refreshCart();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshCart]);

  function commit(next: CartLine[]) {
    applyLines(next);
    if (!hydrated.current) return;
    if (!serverSync.current) {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return;
    }

    const items = next.map(({ productId, variantId, quantity }) => ({
      productId,
      ...(variantId ? { variantId } : {}),
      quantity,
    }));
    const sync = syncQueue.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to sync your cart.");
      });
    syncQueue.current = sync;
    void sync.then(
      () => setSyncError(""),
      (error: unknown) => setSyncError(error instanceof Error ? error.message : "Unable to sync your cart."),
    );
  }

  const value: CartContextValue = {
    lines,
    count: lines.reduce((total, line) => total + line.quantity, 0),
    hydrated: hydratedState,
    syncError,
    add: (product, variant) => {
      const current = linesRef.current;
      const lineId = `${product.id}:${variant?.id ?? "default"}`;
      const found = current.find((line) => line.id === lineId);
      const variantStock = Math.min(20, variant?.stockQuantity ?? product.stockQuantity);
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
    setQuantity: (id, quantity) => commit(linesRef.current.map((line) => line.id === id ? { ...line, quantity: Math.max(1, Math.min(quantity, 20, line.stockQuantity)) } : line)),
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
