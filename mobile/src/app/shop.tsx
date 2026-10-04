import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";

import { addToCart } from "@/lib/cart";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://hng-ecommerce-shop.vercel.app";

type ProductVariant = {
  id: string;
  name: string;
  colorHex: string;
  sku: string;
  stockQuantity: number;
  imageUrl: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  imageUrl: string;
  stockQuantity: number;
  featured: boolean;
  variants: ProductVariant[];
};

type ProductsResponse = {
  products?: Product[];
  error?: string;
};

function formatNaira(cents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category));
    return ["All", ...Array.from(unique)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return products;
    }

    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to load products.");
      }

      setProducts(data.products ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
  }

  async function handleAddToCart(product: Product) {
    const variant = product.variants[0] ?? {
      id: product.id,
      name: "Default",
      colorHex: "#111827",
      sku: product.slug,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
    };

    if (product.stockQuantity <= 0 && variant.stockQuantity <= 0) {
      Alert.alert("Out of stock", "This product is not available right now.");
      return;
    }

    await addToCart({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: variant.imageUrl || product.imageUrl,
      quantity: 1,
      variantName: variant.name,
      colorHex: variant.colorHex,
    });

    Alert.alert("Added to cart", `${product.name} was added to your cart.`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Products could not be loaded.</Text>

        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.button} onPress={loadProducts}>
          <Text style={styles.buttonText}>TRY AGAIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>THE COLLECTION</Text>
        <Text style={styles.title}>Shop.</Text>
        <Text style={styles.description}>
          Useful objects, thoughtfully chosen for everyday living.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;

          return (
            <TouchableOpacity
              key={category}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visibleProducts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No products yet.</Text>
          <Text style={styles.emptyText}>Products from the store will appear here.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visibleProducts.map((product) => (
            <View key={product.id} style={styles.card}>
              <Image
                accessibilityLabel={`${product.name} product thumbnail`}
                alt={`${product.name} product thumbnail`}
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />

              <View style={styles.cardBody}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.productName}>{product.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatNaira(product.priceCents)}</Text>
                  {product.compareAtPriceCents && (
                    <Text style={styles.compareAtPrice}>
                      {formatNaira(product.compareAtPriceCents)}
                    </Text>
                  )}
                </View>

                <Text style={styles.stock}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
                </Text>

                {product.featured && <Text style={styles.featured}>FEATURED</Text>}

                <View style={styles.variantRow}>
                  {(product.variants ?? []).slice(0, 4).map((variant) => (
                    <View
                      key={variant.id}
                      style={[styles.swatch, { backgroundColor: variant.colorHex || "#111827" }]}
                    />
                  ))}
                </View>

                <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(product)}>
                  <Text style={styles.addButtonText}>Add to cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f7f2",
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f7f2",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6b7280",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#6b7280",
  },
  button: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8b5e3c",
  },
  title: {
    marginTop: 8,
    fontSize: 40,
    fontWeight: "600",
    color: "#111827",
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
  filterRow: {
    paddingBottom: 18,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#dddcd6",
    backgroundColor: "#f3f1ea",
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#111827",
  },
  filterLabelActive: {
    color: "#ffffff",
  },
  grid: {
    gap: 18,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dddcd6",
  },
  image: {
    width: "100%",
    height: 230,
    backgroundColor: "#ebe9e1",
  },
  cardBody: {
    padding: 16,
  },
  category: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#8b5e3c",
  },
  productName: {
    marginTop: 7,
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  priceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  compareAtPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  stock: {
    marginTop: 7,
    fontSize: 12,
    color: "#6b7280",
  },
  featured: {
    marginTop: 10,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#8b5e3c",
  },
  variantRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  swatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#d9d4cc",
    borderRadius: 999,
  },
  addButton: {
    marginTop: 18,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});