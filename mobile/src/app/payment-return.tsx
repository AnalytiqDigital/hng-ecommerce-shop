import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { clearCart } from "@/lib/cart";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://hng-ecommerce-shop.vercel.app";

type PaymentStatus = {
  orderNumber?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  error?: string;
};

export default function PaymentReturnScreen() {
  const router = useRouter();
  const { reference } = useLocalSearchParams<{ reference?: string }>();
  const [status, setStatus] = useState<PaymentStatus>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const checkPayment = useCallback(async () => {
    if (!reference) {
      setError("The payment reference is missing.");
      setLoading(false);
      return;
    }
    try {
      setError("");
      const response = await fetch(
        `${API_BASE_URL}/api/orders/payment/${encodeURIComponent(reference)}`,
        { headers: { Accept: "application/json" } }
      );
      const result = (await response.json()) as PaymentStatus;
      if (!response.ok) throw new Error(result.error || "Unable to verify this payment.");
      setStatus(result);
      if (result.paymentStatus === "paid") await clearCart();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify this payment.");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    const timer = setTimeout(() => void checkPayment(), 0);
    return () => clearTimeout(timer);
  }, [checkPayment, attempt]);

  useEffect(() => {
    if (status.paymentStatus === "paid" || status.paymentStatus === "failed") return;
    const timer = setTimeout(() => setAttempt((current) => current + 1), 2500);
    return () => clearTimeout(timer);
  }, [status.paymentStatus, attempt]);

  const paid = status.paymentStatus === "paid";
  const failed = status.paymentStatus === "failed";

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>PAYMENT STATUS</Text>
      <Text style={styles.title}>
        {paid ? "Payment confirmed." : failed ? "Payment not confirmed." : "Verifying payment."}
      </Text>
      {loading && !paid && !failed ? (
        <ActivityIndicator style={styles.spinner} size="large" color="#1f2937" />
      ) : null}
      <Text style={styles.message}>
        {paid
          ? "Your order is confirmed. Your cart has been cleared."
          : failed
            ? "The payment was not confirmed. Your cart is still saved."
            : error || "We are checking the transaction with Paystack. This may take a moment."}
      </Text>
      {status.orderNumber ? (
        <Text style={styles.orderNumber}>Order {status.orderNumber}</Text>
      ) : null}
      {(failed || error) && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setAttempt((current) => current + 1)}
        >
          <Text style={styles.secondaryText}>Check again</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace(paid ? "/shop" : "/cart")}
      >
        <Text style={styles.primaryText}>{paid ? "Continue shopping" : "Return to cart"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#f8f7f2",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8b5e3c",
  },
  title: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: "600",
    color: "#111827",
  },
  spinner: {
    marginTop: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
  orderNumber: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  primaryButton: {
    marginTop: 28,
    padding: 15,
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  secondaryButton: {
    marginTop: 18,
    alignItems: "center",
  },
  secondaryText: {
    color: "#1f2937",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
