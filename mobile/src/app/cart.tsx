import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { clearCart, getCart, getCartSubtotal, removeFromCart, updateQuantity, type CartItem } from "@/lib/cart";

function formatNaira(cents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCart = useCallback(async () => {
    try {
      const cart = await getCart();
      setItems(cart);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your cart.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  async function handleQuantityChange(productId: string, variantName: string | undefined, delta: number) {
    try {
      const next = await updateQuantity(productId, variantName, delta);
      setItems(next);
    } catch (cause) {
      Alert.alert("Cart not updated", cause instanceof Error ? cause.message : "Unable to update your cart.");
    }
  }

  async function handleRemove(productId: string, variantName?: string) {
    try {
      const next = await removeFromCart(productId, variantName);
      setItems(next);
    } catch (cause) {
      Alert.alert("Item not removed", cause instanceof Error ? cause.message : "Unable to update your cart.");
    }
  }

  async function handleClearCart() {
    Alert.alert("Clear cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await clearCart();
            setItems([]);
          } catch (cause) {
            Alert.alert("Cart not cleared", cause instanceof Error ? cause.message : "Unable to clear your cart.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  const subtotal = getCartSubtotal(items);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.eyebrow}>YOUR CART</Text>
        <Text style={styles.title}>Cart.</Text>
        <Text style={styles.description}>{error || "Your cart is empty. Add a few considered pieces and they’ll appear here."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>YOUR CART</Text>
      <Text style={styles.title}>Cart.</Text>

      {items.map((item) => (
        <View key={`${item.productId}-${item.variantName ?? "default"}`} style={styles.itemCard}>
          <Image
            accessibilityLabel={`${item.name} thumbnail`}
            alt={`${item.name} thumbnail`}
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
            resizeMode="cover"
          />

          <View style={styles.itemBody}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.variantName ? <Text style={styles.variant}>{item.variantName}</Text> : null}
            <Text style={styles.itemPrice}>{formatNaira(item.priceCents)}</Text>

            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(item.productId, item.variantName, -1)}
              >
                <Text style={styles.qtyText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.qtyValue}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(item.productId, item.variantName, 1)}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(item.productId, item.variantName)}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        disabled={loading}
        onPress={() => router.push("/checkout")}
      >
        <Text style={styles.checkoutText}>{loading ? "Processing..." : "Checkout"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
        <Text style={styles.clearText}>Clear cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#f6f3ec",
    padding: 24,
    paddingTop: 60,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#a76349",
  },
  title: {
    marginTop: 8,
    fontSize: 40,
    fontWeight: "600",
    color: "#293a2e",
  },
  description: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
  itemCard: {
    marginTop: 22,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
    borderRadius: 5,
    flexDirection: "row",
  },
  itemImage: {
    width: 110,
    height: 140,
    backgroundColor: "#ebe9e1",
  },
  itemBody: {
    flex: 1,
    padding: 14,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#293a2e",
  },
  variant: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#a76349",
  },
  itemPrice: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#293a2e",
  },
  quantityRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0dbd0",
    borderRadius: 3,
    backgroundColor: "#fbf9f3",
  },
  qtyText: {
    fontSize: 20,
    lineHeight: 20,
    color: "#293a2e",
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#293a2e",
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    marginTop: 14,
    alignSelf: "flex-start",
  },
  removeText: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#7f1d1d",
  },
  summaryBox: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e3ded3",
  },
  summaryLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  checkoutButton: {
    marginTop: 22,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#344b3b",
    borderRadius: 3,
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  clearButton: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#344b3b",
    borderRadius: 3,
  },
  clearText: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#344b3b",
  },
});