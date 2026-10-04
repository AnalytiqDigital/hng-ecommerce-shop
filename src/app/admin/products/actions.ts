"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { adminUsers, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export type ProductStatus = "draft" | "published" | "archived";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/products");
  }

  const [admin] = await getDb()
    .select({ userId: adminUsers.userId })
    .from(adminUsers)
    .where(eq(adminUsers.userId, user.id))
    .limit(1);

  if (!admin) {
    redirect("/");
  }

  return user;
}

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseRequiredCents(value: string, fieldName: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  const amount = Number(cleaned);

  if (!cleaned || !Number.isFinite(amount) || amount < 0) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }

  return Math.round(amount * 100);
}

function parseOptionalCents(value: string, fieldName: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();

  if (!cleaned) {
    return null;
  }

  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }

  return Math.round(amount * 100);
}

function parseStock(value: string) {
  const stock = Number(value);

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock quantity must be a whole number of 0 or more.");
  }

  return stock;
}

function parseStatus(value: string): ProductStatus {
  if (value !== "draft" && value !== "published" && value !== "archived") {
    throw new Error("Invalid product status.");
  }

  return value;
}

function isRedirectError(error: unknown) {
  return (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = getText(formData, "name");
  const slugInput = getText(formData, "slug");
  const description = getText(formData, "description");
  const shortDescription = getText(formData, "shortDescription");
  const sku = getText(formData, "sku");
  const brand = getText(formData, "brand");
  const imageUrl = getText(formData, "imageUrl");
  const categoryId = getText(formData, "categoryId");
  const seoTitle = getText(formData, "seoTitle");
  const seoDescription = getText(formData, "seoDescription");

  if (!name || !description || !sku || !imageUrl) {
    redirect(
      `/admin/products?error=${encodeURIComponent(
        "Name, description, SKU and image URL are required."
      )}`
    );
  }

  try {
    const priceCents = parseRequiredCents(getText(formData, "price"), "Price");
    const compareAtPriceCents = parseOptionalCents(
      getText(formData, "compareAtPrice"),
      "Compare-at price"
    );

    if (
      compareAtPriceCents !== null &&
      compareAtPriceCents < priceCents
    ) {
      throw new Error(
        "Compare-at price must be greater than or equal to the selling price."
      );
    }

    const stockQuantity = parseStock(
      getText(formData, "stockQuantity") || "0"
    );
    const status = parseStatus(getText(formData, "status") || "draft");
    const slug = slugify(slugInput || name);

    if (!slug) {
      throw new Error("A valid product slug is required.");
    }

    await getDb().insert(products).values({
      name,
      slug,
      description,
      shortDescription: shortDescription || null,
      priceCents,
      compareAtPriceCents,
      sku,
      stockQuantity,
      categoryId: categoryId || null,
      brand: brand || null,
      imageUrl,
      featured: formData.get("featured") === "on",
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    redirect("/admin/products");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message.toLowerCase().includes("unique")
          ? "The product slug or SKU already exists."
          : error.message
        : "Unable to create the product.";

    redirect(`/admin/products?error=${encodeURIComponent(message)}`);
  }
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = getText(formData, "id");

  if (!id) {
    redirect(
      `/admin/products?error=${encodeURIComponent("Product ID is missing.")}`
    );
  }

  const name = getText(formData, "name");
  const slugInput = getText(formData, "slug");
  const description = getText(formData, "description");
  const shortDescription = getText(formData, "shortDescription");
  const sku = getText(formData, "sku");
  const brand = getText(formData, "brand");
  const imageUrl = getText(formData, "imageUrl");
  const categoryId = getText(formData, "categoryId");
  const seoTitle = getText(formData, "seoTitle");
  const seoDescription = getText(formData, "seoDescription");

  if (!name || !description || !sku || !imageUrl) {
    redirect(
      `/admin/products?edit=${encodeURIComponent(id)}&error=${encodeURIComponent(
        "Name, description, SKU and image URL are required."
      )}`
    );
  }

  try {
    const priceCents = parseRequiredCents(getText(formData, "price"), "Price");
    const compareAtPriceCents = parseOptionalCents(
      getText(formData, "compareAtPrice"),
      "Compare-at price"
    );

    if (
      compareAtPriceCents !== null &&
      compareAtPriceCents < priceCents
    ) {
      throw new Error(
        "Compare-at price must be greater than or equal to the selling price."
      );
    }

    const stockQuantity = parseStock(
      getText(formData, "stockQuantity") || "0"
    );
    const status = parseStatus(getText(formData, "status") || "draft");
    const slug = slugify(slugInput || name);

    if (!slug) {
      throw new Error("A valid product slug is required.");
    }

    await getDb()
      .update(products)
      .set({
        name,
        slug,
        description,
        shortDescription: shortDescription || null,
        priceCents,
        compareAtPriceCents,
        sku,
        stockQuantity,
        categoryId: categoryId || null,
        brand: brand || null,
        imageUrl,
        featured: formData.get("featured") === "on",
        status,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/products/${id}`);
    redirect("/admin/products");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message.toLowerCase().includes("unique")
          ? "The product slug or SKU already exists."
          : error.message
        : "Unable to update the product.";

    redirect(
      `/admin/products?edit=${encodeURIComponent(id)}&error=${encodeURIComponent(
        message
      )}`
    );
  }
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const id = getText(formData, "id");

  if (!id) {
    redirect(
      `/admin/products?error=${encodeURIComponent("Product ID is missing.")}`
    );
  }

  try {
    await getDb().delete(products).where(eq(products.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    redirect("/admin/products");
  } catch {
    redirect(
      `/admin/products?error=${encodeURIComponent(
        "This product could not be deleted. It may still be referenced elsewhere."
      )}`
    );
  }
}

export async function toggleProductStatus(formData: FormData) {
  await requireAdmin();

  const id = getText(formData, "id");
  const currentStatus = getText(formData, "status");

  if (!id) {
    redirect("/admin/products");
  }

  let nextStatus: ProductStatus;

  if (currentStatus === "published") {
    nextStatus = "draft";
  } else {
    nextStatus = "published";
  }

  await getDb()
    .update(products)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}
