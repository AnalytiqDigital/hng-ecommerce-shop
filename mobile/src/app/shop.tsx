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
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

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
  const columns = width >= 760 ? 3 : 2;
  const cardWidth = (width - 40 - 12 * (columns - 1)) / columns;

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
    const variant = product.variants.find(
      (candidate) => candidate.id === selectedVariants[product.id]
    ) ?? product.variants[0];
    const availableStock = variant?.stockQuantity ?? product.stockQuantity;

    if (availableStock <= 0) {
      Alert.alert("Out of stock", "This product is not available right now.");
      return;
    }

    await addToCart({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: variant?.imageUrl || product.imageUrl,
      quantity: 1,
      variantId: variant?.id,
      variantName: variant?.name,
      colorHex: variant?.colorHex,
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>THE FORM & FIELD EDIT</Text>
            <Text style={styles.title}>Shop the good things.</Text>
          </View>
          <View style={styles.productCount}>
            <Text style={styles.productCountValue}>{products.length.toString().padStart(2, "0")}</Text>
            <Text style={styles.productCountLabel}>PIECES</Text>
          </View>
        </View>
        <Text style={styles.description}>
          Thoughtful objects for slower mornings and better everyday rituals.
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
            <View key={product.id} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.imageFrame}>
                <Image
                  accessibilityLabel={`${product.name} product thumbnail`}
                  alt={`${product.name} product thumbnail`}
                  source={{ uri: product.imageUrl }}
                  style={[styles.image, { height: cardWidth * 1.08 }]}
                  resizeMode="cover"
                />
                {product.featured && (
                  <View style={styles.featuredTag}>
                    <Text style={styles.featuredTagText}>THE EDIT</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatNaira(product.priceCents)}</Text>
                  {product.compareAtPriceCents && (
                    <Text style={styles.compareAtPrice}>
                      {formatNaira(product.compareAtPriceCents)}
                    </Text>
                  )}
                </View>

                {(() => {
                  const selectedVariant = product.variants.find(
                    (variant) => variant.id === selectedVariants[product.id]
                  ) ?? product.variants[0];
                  const stockQuantity = selectedVariant?.stockQuantity ?? product.stockQuantity;
                  return (
                    <Text style={styles.stock}>
                      {stockQuantity > 0 ? `${stockQuantity} in stock` : "Out of stock"}
                    </Text>
                  );
                })()}

                <View style={styles.variantRow}>
                  {(product.variants ?? []).map((variant) => (
                    <TouchableOpacity
                      key={variant.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`Choose ${variant.name}`}
                      accessibilityState={{
                        selected:
                          (selectedVariants[product.id] ?? product.variants[0]?.id) === variant.id,
                        disabled: variant.stockQuantity <= 0,
                      }}
                      disabled={variant.stockQuantity <= 0}
                      onPress={() =>
                        setSelectedVariants((current) => ({
                          ...current,
                          [product.id]: variant.id,
                        }))
                      }
                      style={[
                        styles.swatch,
                        { backgroundColor: variant.colorHex || "#111827" },
                        (selectedVariants[product.id] ?? product.variants[0]?.id) === variant.id &&
                          styles.swatchSelected,
                        variant.stockQuantity <= 0 && styles.swatchDisabled,
                      ]}
                    />
                  ))}
                </View>
                {product.variants.length > 0 && (
                  <Text style={styles.variantName}>
                    {product.variants.find(
                      (variant) =>
                        variant.id ===
                        (selectedVariants[product.id] ?? product.variants[0]?.id)
                    )?.name ?? "Choose a color"}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(product)}
                  disabled={
                    (product.variants.find(
                      (variant) => variant.id === selectedVariants[product.id]
                    ) ?? product.variants[0])?.stockQuantity === 0 ||
                    (!product.variants.length && product.stockQuantity === 0)
                  }
                >
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
    paddingHorizontal: 20,
    paddingTop: 22,
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
    padding: 18,
    backgroundColor: "#e9e9e1",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.8,
    color: "#a76349",
  },
  title: {
    maxWidth: 235,
    marginTop: 7,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "500",
    color: "#293a2e",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCount: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f6f3ec",
    alignItems: "center",
    justifyContent: "center",
  },
  productCountValue: {
    color: "#293a2e",
    fontSize: 18,
    fontWeight: "600",
  },
  productCountLabel: {
    marginTop: 2,
    color: "#898678",
    fontSize: 7,
    letterSpacing: 1,
  },
  description: {
    maxWidth: 300,
    marginTop: 10,
    fontSize: 12,
    lineHeight: 19,
    color: "#62675e",
  },
  filterRow: {
    paddingBottom: 17,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ded9ce",
    backgroundColor: "#fffdf8",
  },
  filterChipActive: {
    backgroundColor: "#344b3b",
    borderColor: "#344b3b",
  },
  filterLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#111827",
  },
  filterLabelActive: {
    color: "#ffffff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e7e2d8",
    borderRadius: 5,
  },
  imageFrame: {
    position: "relative",
    backgroundColor: "#e9e5db",
  },
  image: {
    width: "100%",
    backgroundColor: "#ebe9e1",
  },
  featuredTag: {
    position: "absolute",
    left: 8,
    top: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    backgroundColor: "#f6f3ec",
  },
  featuredTagText: {
    color: "#465747",
    fontSize: 7,
    letterSpacing: 1,
  },
  cardBody: {
    padding: 10,
  },
  category: {
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#8b5e3c",
  },
  productName: {
    minHeight: 34,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: "#293a2e",
  },
  priceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  compareAtPrice: {
    fontSize: 10,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  stock: {
    marginTop: 5,
    fontSize: 9,
    color: "#7b7d72",
  },
  featured: {
    marginTop: 10,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#8b5e3c",
  },
  variantRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  swatch: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#d9d4cc",
    borderRadius: 999,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: "#8b5e3c",
  },
  swatchDisabled: {
    opacity: 0.35,
  },
  variantName: {
    marginTop: 7,
    fontSize: 11,
    color: "#6b7280",
  },
  addButton: {
    marginTop: 12,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#344b3b",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 8,
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