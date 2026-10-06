import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";

export type CartItem = {
  productId: string;
  slug?: string;
  productName?: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  stockQuantity?: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
  colorHex?: string;
};

type CartResponse = {
  items?: Array<CartItem & { productName?: string; variantColorHex?: string }>;
  error?: string;
};

const CART_KEY = "form-field-cart";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://hng-ecommerce-shop.vercel.app";

async function getAccessToken() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

export async function getCartRequestHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function fromServer(items: CartResponse["items"]): CartItem[] {
  if (!Array.isArray(items)) throw new Error("The saved cart response was invalid.");
  return items.map(({ productName, variantColorHex, ...item }) => ({
    ...item,
    name: productName ?? item.name,
    colorHex: variantColorHex ?? item.colorHex,
  }));
}

export async function getCart(): Promise<CartItem[]> {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    });
    const result = (await response.json()) as CartResponse;
    if (!response.ok) throw new Error(result.error || "Unable to load your saved cart.");
    const items = fromServer(result.items);
    await SecureStore.setItemAsync(CART_KEY, JSON.stringify(items));
    return items;
  }

  try {
    const raw = await SecureStore.getItemAsync(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCart(items: CartItem[]) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    await SecureStore.setItemAsync(CART_KEY, JSON.stringify(items));
    return items;
  }

  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: items.map(({ productId, variantId, quantity }) => ({
        productId,
        ...(variantId ? { variantId } : {}),
        quantity,
      })),
    }),
  });
  const result = (await response.json()) as CartResponse;
  if (!response.ok) throw new Error(result.error || "Unable to save your cart.");
  const savedItems = fromServer(result.items);
  await SecureStore.setItemAsync(CART_KEY, JSON.stringify(savedItems));
  return savedItems;
}

export async function addToCart(item: CartItem) {
  const current = await getCart();
  const existingIndex = current.findIndex(
    (entry) =>
      entry.productId === item.productId &&
      (entry.variantId && item.variantId
        ? entry.variantId === item.variantId
        : (entry.variantName ?? "") === (item.variantName ?? ""))
  );

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      variantId: item.variantId ?? current[existingIndex].variantId,
      variantName: item.variantName ?? current[existingIndex].variantName,
      colorHex: item.colorHex ?? current[existingIndex].colorHex,
      quantity: Math.min(
        current[existingIndex].quantity + item.quantity,
        20,
        current[existingIndex].stockQuantity ?? 20,
      ),
    };
  } else {
    current.push(item);
  }

  return saveCart(current);
}

export async function updateQuantity(productId: string, variantName: string | undefined, delta: number) {
  const current = await getCart();
  const next = current
    .map((entry) => {
      const sameProduct =
        entry.productId === productId &&
        (entry.variantName ?? "") === (variantName ?? "");

      if (!sameProduct) {
        return entry;
      }

      const updatedQuantity = entry.quantity + delta;
      if (updatedQuantity <= 0) {
        return null;
      }

      return {
        ...entry,
        quantity: Math.min(updatedQuantity, 20, entry.stockQuantity ?? 20),
      };
    })
    .filter(Boolean) as CartItem[];

  return saveCart(next);
}

export async function removeFromCart(productId: string, variantName?: string) {
  const current = await getCart();
  const next = current.filter(
    (entry) =>
      !(entry.productId === productId && (entry.variantName ?? "") === (variantName ?? ""))
  );

  return saveCart(next);
}

export async function clearCart() {
  await saveCart([]);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}
