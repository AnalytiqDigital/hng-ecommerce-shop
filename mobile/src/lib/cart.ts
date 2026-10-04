import * as SecureStore from "expo-secure-store";

export type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  variantName?: string;
  colorHex?: string;
};

const CART_KEY = "form-field-cart";

export async function getCart(): Promise<CartItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCart(items: CartItem[]) {
  await SecureStore.setItemAsync(CART_KEY, JSON.stringify(items));
}

export async function addToCart(item: CartItem) {
  const current = await getCart();
  const existingIndex = current.findIndex(
    (entry) =>
      entry.productId === item.productId &&
      (entry.variantName ?? "") === (item.variantName ?? "")
  );

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      quantity: current[existingIndex].quantity + item.quantity,
    };
  } else {
    current.push(item);
  }

  await saveCart(current);
  return current;
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

      return { ...entry, quantity: updatedQuantity };
    })
    .filter(Boolean) as CartItem[];

  await saveCart(next);
  return next;
}

export async function removeFromCart(productId: string, variantName?: string) {
  const current = await getCart();
  const next = current.filter(
    (entry) =>
      !(entry.productId === productId && (entry.variantName ?? "") === (variantName ?? ""))
  );

  await saveCart(next);
  return next;
}

export async function clearCart() {
  await saveCart([]);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}
