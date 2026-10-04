import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { adminUsers, categories, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  createProduct,
  deleteProduct,
  toggleProductStatus,
  updateProduct,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  edit?: string;
  error?: string;
};

type AdminProductsPageProps = {
  searchParams?: Promise<SearchParams>;
};

async function requireAdminPage() {
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
}

function formatNaira(cents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ProductForm({
  product,
  categoryRows,
  error,
}: {
  product?: typeof products.$inferSelect;
  categoryRows: typeof categories.$inferSelect[];
  error?: string;
}) {
  const editing = product !== undefined;
  const productTitle = product?.name ?? "Create a product";
  const productId = product?.id;

  return (
    <section className="border border-line bg-paper">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-clay">
              {editing ? "Edit product" : "New product"}
            </p>
            <h2 className="mt-1 font-display text-[25px]">
              {editing ? productTitle : "Create a product"}
            </h2>
          </div>

          {editing && (
            <Link
              href="/admin/products"
              className="text-[10px] uppercase tracking-[0.12em] underline"
            >
              Cancel
            </Link>
          )}
        </div>

        {error && (
          <p className="mt-4 border border-line bg-[#fff8f5] p-3 text-[12px] text-clay">
            {error}
          </p>
        )}
      </div>

      <form
        action={editing ? updateProduct : createProduct}
        className="grid gap-5 p-5 sm:p-6"
      >
        {editing && productId && <input type="hidden" name="id" value={productId} />}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Product name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={product?.name ?? ""}
              required
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="slug" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={product?.slug ?? ""}
              placeholder="leave blank to generate from name"
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="shortDescription" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
            Short description
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={product?.shortDescription ?? ""}
            className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
            Full description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ""}
            required
            rows={5}
            className="w-full border border-line bg-white px-3 py-3 text-[13px] outline-none focus:border-ink"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="price" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Price (₦)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
              required
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="compareAtPrice" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Compare-at price (₦)
            </label>
            <input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                product?.compareAtPriceCents != null
                  ? (product.compareAtPriceCents / 100).toFixed(2)
                  : ""
              }
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="sku" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              defaultValue={product?.sku ?? ""}
              required
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="stockQuantity" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Stock
            </label>
            <input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stockQuantity ?? 0}
              required
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="categoryId" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            >
              <option value="">No category</option>
              {categoryRows.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brand" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              defaultValue={product?.brand ?? ""}
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? "draft"}
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex h-11 w-full items-center gap-3 border border-line bg-white px-3 text-[12px]">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
              />
              Featured product
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="imageUrl" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
            Main image URL
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product?.imageUrl ?? ""}
            required
            placeholder="https://..."
            className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="seoTitle" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              SEO title
            </label>
            <input
              id="seoTitle"
              name="seoTitle"
              defaultValue={product?.seoTitle ?? ""}
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="seoDescription" className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted">
              SEO description
            </label>
            <input
              id="seoDescription"
              name="seoDescription"
              defaultValue={product?.seoDescription ?? ""}
              className="h-11 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="h-11 bg-ink px-6 text-[10px] uppercase tracking-[0.13em] text-white hover:opacity-90"
          >
            {editing ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdminPage();

  const params = searchParams ? await searchParams : {};

  const productRows = await getDb()
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  const categoryRows = await getDb()
    .select()
    .from(categories)
    .orderBy(categories.name);

  const selectedProduct = params.edit
    ? productRows.find((product) => product.id === params.edit)
    : undefined;

  const categoryMap = new Map(
    categoryRows.map((category) => [category.id, category.name])
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-clay">
            Store management
          </p>
          <h1 className="mt-2 font-display text-[40px]">Products.</h1>
          <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-muted">
            Create, edit, publish, archive and remove products from your store.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center justify-center border border-ink px-5 text-[10px] uppercase tracking-[0.13em]"
        >
          + New product
        </Link>
      </div>

      <div className="mt-8">
        <ProductForm
          product={selectedProduct}
          categoryRows={categoryRows}
          error={params.error}
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[25px]">All products</h2>
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            {productRows.length} products
          </span>
        </div>

        <div className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[900px] text-left text-[11px]">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-4 py-3 font-normal">Product</th>
                <th className="px-4 py-3 font-normal">SKU</th>
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Price</th>
                <th className="px-4 py-3 font-normal">Stock</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>

            <tbody>
              {productRows.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        aria-label={product.name}
                        className="h-12 w-12 border border-line bg-[#f5f2ed] bg-cover bg-center"
                        style={
                          product.imageUrl
                            ? { backgroundImage: `url("${product.imageUrl}")` }
                            : undefined
                        }
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.featured && (
                          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-clay">
                            Featured
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-muted">{product.sku}</td>
                  <td className="px-4 py-4 text-muted">
                    {product.categoryId
                      ? categoryMap.get(product.categoryId) ?? "Uncategorised"
                      : "Uncategorised"}
                  </td>
                  <td className="px-4 py-4">{formatNaira(product.priceCents)}</td>
                  <td className="px-4 py-4">
                    <span className={product.stockQuantity <= 5 ? "text-clay" : ""}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="capitalize">{product.status}</span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/products?edit=${product.id}`}
                        className="underline underline-offset-4"
                      >
                        Edit
                      </Link>

                      <form action={toggleProductStatus}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="status" value={product.status} />
                        <button type="submit" className="underline underline-offset-4">
                          {product.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                      </form>

                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="text-clay underline underline-offset-4">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {productRows.length === 0 && (
            <p className="px-5 py-12 text-center text-[12px] text-muted">
              No products found. Create your first product above.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
