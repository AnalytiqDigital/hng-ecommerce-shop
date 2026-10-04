import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { getCart, getCartSubtotal, type CartItem } from "@/lib/cart";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://hng-ecommerce-shop.vercel.app";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
};

function formatNaira(cents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CheckoutScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const subtotal = getCartSubtotal(items);

  const loadCart = useCallback(async () => {
    const cart = await getCart();
    setItems(cart);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCart();
    }, [loadCart])
  );

  async function handleSubmit() {
    if (items.length === 0) {
      Alert.alert("Your cart is empty", "Add products before checking out.");
      return;
    }

    if (!form.fullName || !form.email || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.country) {
      setError("Please complete all required checkout fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const redirectUrl = Linking.createURL("payment-return");
      const legacyVariantItems = items.filter(
        (item) => !item.variantId && item.variantName
      );
      let productsById = new Map<
        string,
        { variants?: Array<{ id: string; name: string }> }
      >();

      if (legacyVariantItems.length > 0) {
        const productsResponse = await fetch(`${API_BASE_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });
        const productsData = (await productsResponse.json()) as {
          products?: Array<{ id: string; variants?: Array<{ id: string; name: string }> }>;
          error?: string;
        };
        if (!productsResponse.ok) {
          throw new Error(productsData.error || "Unable to refresh product options.");
        }
        productsById = new Map(
          (productsData.products ?? []).map((product) => [product.id, product])
        );
      }

      const payload = {
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress: {
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
          postalCode: form.postalCode.trim() || null,
        },
        items: items.map((item) => {
          const matchingVariant = item.variantId
            ? undefined
            : productsById
                .get(item.productId)
                ?.variants?.find((variant) => variant.name === item.variantName);
          const productHasVariants =
            (productsById.get(item.productId)?.variants?.length ?? 0) > 0;
          if (!item.variantId && item.variantName && productHasVariants && !matchingVariant) {
            throw new Error(
              `${item.name}'s selected option is no longer available. Remove it and add the product again.`
            );
          }
          return {
            productId: item.productId,
            ...(item.variantId || matchingVariant?.id
              ? { variantId: item.variantId ?? matchingVariant?.id }
              : {}),
            quantity: item.quantity,
          };
        }),
        platform: "mobile",
        mobileReturnUrl: redirectUrl,
      };

      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        authorizationUrl?: string;
        orderNumber?: string;
        error?: string;
      };

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.authorizationUrl,
        redirectUrl
      );
      if (result.type === "success" && result.url) {
        const returnedReference = Linking.parse(result.url).queryParams?.reference;
        const reference = Array.isArray(returnedReference)
          ? returnedReference[0]
          : returnedReference;
        if (reference) {
          router.replace({
            pathname: "/payment-return",
            params: { reference },
          });
        } else {
          setError("We returned from payment without a reference. Please check your order status.");
        }
      } else if (result.type === "cancel" || result.type === "dismiss") {
        setError("Payment was not completed. Your cart is still saved; you can try again.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1f2937" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.eyebrow}>CHECKOUT</Text>
        <Text style={styles.title}>Your cart is empty.</Text>
        <Text style={styles.emptyText}>Add a few pieces before starting checkout.</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/shop")}>
          <Text style={styles.primaryButtonText}>Back to shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>CHECKOUT</Text>
        <Text style={styles.title}>Complete your order.</Text>

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact details</Text>

          <TextInput
            placeholder="Full name"
            value={form.fullName}
            onChangeText={(text) => setForm((current) => ({ ...current, fullName: text }))}
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TextInput
            placeholder="Email address"
            value={form.email}
            onChangeText={(text) => setForm((current) => ({ ...current, email: text }))}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            placeholder="Phone number"
            value={form.phone}
            onChangeText={(text) => setForm((current) => ({ ...current, phone: text }))}
            style={styles.input}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Delivery address</Text>

          <TextInput
            placeholder="Street address"
            value={form.addressLine1}
            onChangeText={(text) => setForm((current) => ({ ...current, addressLine1: text }))}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Apartment, suite, etc. (optional)"
            value={form.addressLine2}
            onChangeText={(text) => setForm((current) => ({ ...current, addressLine2: text }))}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="City"
            value={form.city}
            onChangeText={(text) => setForm((current) => ({ ...current, city: text }))}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="State"
            value={form.state}
            onChangeText={(text) => setForm((current) => ({ ...current, state: text }))}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Country"
            value={form.country}
            onChangeText={(text) => setForm((current) => ({ ...current, country: text }))}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Postal code (optional)"
            value={form.postalCode}
            onChangeText={(text) => setForm((current) => ({ ...current, postalCode: text }))}
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Order summary</Text>

          {items.map((item) => (
            <View key={`${item.productId}-${item.variantName ?? "default"}`} style={styles.summaryRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>Qty {item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatNaira(item.priceCents * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatNaira(subtotal)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Opening payment..." : "Continue to payment"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back to cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f3ec",
  },
  loadingText: {
    marginTop: 12,
    color: "#374151",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    backgroundColor: "#f8f7f2",
    padding: 24,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#a76349",
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "600",
    color: "#293a2e",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
  },
  formSection: {
    marginTop: 24,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
    borderRadius: 4,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#a76349",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0dbd0",
    borderRadius: 3,
    backgroundColor: "#fbf9f3",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#293a2e",
  },
  summaryBox: {
    marginTop: 24,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
    borderRadius: 4,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#a76349",
  },
  summaryRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eeeae2",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#293a2e",
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
  },
  itemPrice: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#293a2e",
  },
  totalRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "#e3ded3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalText: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#293a2e",
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#344b3b",
    borderRadius: 3,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  errorBox: {
    marginTop: 18,
    backgroundColor: "#fbe5e5",
    color: "#7f1d1d",
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
  },
});
