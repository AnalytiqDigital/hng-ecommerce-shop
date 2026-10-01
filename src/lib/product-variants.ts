export type ProductColor = { name: string; colorHex: string };

export const defaultProductColors: ProductColor[] = [
  { name: "Natural", colorHex: "#ceb99c" },
  { name: "Olive", colorHex: "#687260" },
  { name: "Charcoal", colorHex: "#434744" },
];

export const productColorsByCategory: Record<string, ProductColor[]> = {
  home: [{ name: "Chalk", colorHex: "#e9e4d9" }, { name: "Moss", colorHex: "#7a826d" }, { name: "Clay", colorHex: "#ac705a" }],
  accessories: [{ name: "Natural", colorHex: "#ceb99c" }, { name: "Olive", colorHex: "#58684e" }, { name: "Black", colorHex: "#33352f" }],
  lighting: [{ name: "Brass", colorHex: "#b18a4a" }, { name: "Opal", colorHex: "#f4f1e8" }, { name: "Graphite", colorHex: "#414747" }],
  clothing: [{ name: "Oat", colorHex: "#d8c8aa" }, { name: "Sage", colorHex: "#8a9781" }, { name: "Ink", colorHex: "#343a3c" }],
  objects: [{ name: "Chalk", colorHex: "#eeece3" }, { name: "Sage", colorHex: "#99a78e" }, { name: "Terracotta", colorHex: "#b96850" }],
};

export function getProductColors(category: string | null | undefined) {
  return productColorsByCategory[category?.toLowerCase() ?? ""] ?? defaultProductColors;
}

export function distributeVariantStock(totalStock: number, variantCount: number) {
  if (!Number.isInteger(totalStock) || totalStock < 0 || !Number.isInteger(variantCount) || variantCount < 1) {
    throw new Error("Stock must be a non-negative integer and variant count must be positive.");
  }
  const base = Math.floor(totalStock / variantCount);
  const remainder = totalStock % variantCount;
  return Array.from({ length: variantCount }, (_, index) => base + (index < remainder ? 1 : 0));
}