import { sql } from "drizzle-orm";
import {
  check,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", ["draft", "published", "archived"]);
export const orderStatus = pgEnum("order_status", [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("profiles_email_idx").on(table.email),
  pgPolicy("profiles_owner_read", { for: "select", to: "authenticated", using: sql`${table.id} = auth.uid()` }),
]).enableRLS();

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  pgPolicy("categories_public_active_read", { for: "select", to: ["anon", "authenticated"], using: sql`${table.active} = true` }),
]).enableRLS();

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  priceCents: integer("price_cents").notNull(),
  compareAtPriceCents: integer("compare_at_price_cents"),
  sku: text("sku").notNull().unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  brand: text("brand"),
  imageUrl: text("image_url").notNull(),
  featured: boolean("featured").notNull().default(false),
  status: productStatus("status").notNull().default("draft"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("products_category_idx").on(table.categoryId),
  index("products_status_idx").on(table.status),
  index("products_featured_idx").on(table.featured),
  check("products_price_nonnegative", sql`${table.priceCents} >= 0`),
  check("products_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
  check("products_compare_price_valid", sql`${table.compareAtPriceCents} is null or ${table.compareAtPriceCents} >= ${table.priceCents}`),
  pgPolicy("products_public_published_read", { for: "select", to: ["anon", "authenticated"], using: sql`${table.status} = 'published'` }),
]).enableRLS();

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  sku: text("sku").notNull().unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
}, (table) => [
  index("product_variants_product_idx").on(table.productId),
  uniqueIndex("product_variant_name_unique").on(table.productId, table.name),
  check("product_variant_color_hex_valid", sql`${table.colorHex} ~ '^#[0-9A-Fa-f]{6}$'`),
  check("product_variant_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
  pgPolicy("product_variants_public_active_read", { for: "select", to: ["anon", "authenticated"], using: sql`${table.active} = true and exists (select 1 from ${products} where ${products.id} = ${table.productId} and ${products.status} = 'published')` }),
]).enableRLS();

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  position: integer("position").notNull().default(0),
}, (table) => [
  index("product_images_product_idx").on(table.productId),
  pgPolicy("product_images_public_published_read", { for: "select", to: ["anon", "authenticated"], using: sql`exists (select 1 from ${products} where ${products.id} = ${table.productId} and ${products.status} = 'published')` }),
]).enableRLS();

export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  sessionId: text("session_id").unique(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("carts_user_unique").on(table.userId),
  pgPolicy("carts_owner_read", { for: "select", to: "authenticated", using: sql`${table.userId} = auth.uid()` }),
]).enableRLS();

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
}, (table) => [
  uniqueIndex("cart_product_variant_unique").on(table.cartId, table.productId, table.variantId),
  pgPolicy("cart_items_owner_read", { for: "select", to: "authenticated", using: sql`exists (select 1 from ${carts} where ${carts.id} = ${table.cartId} and ${carts.userId} = auth.uid())` }),
]).enableRLS();

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").notNull().default(false),
}, (table) => [
  pgPolicy("addresses_owner_read", { for: "select", to: "authenticated", using: sql`${table.userId} = auth.uid()` }),
]).enableRLS();

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
  currency: text("currency").notNull().default("NGN"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("orders_user_idx").on(table.userId),
  index("orders_created_idx").on(table.createdAt),
  check("orders_amounts_nonnegative", sql`${table.subtotalCents} >= 0 and ${table.shippingCents} >= 0 and ${table.discountCents} >= 0 and ${table.totalCents} >= 0`),
  pgPolicy("orders_owner_read", { for: "select", to: "authenticated", using: sql`${table.userId} = auth.uid()` }),
]).enableRLS();

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  variantName: text("variant_name"),
  variantColorHex: text("variant_color_hex"),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
}, (table) => [
  check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  check("order_items_price_nonnegative", sql`${table.unitPriceCents} >= 0`),
  pgPolicy("order_items_owner_read", { for: "select", to: "authenticated", using: sql`exists (select 1 from ${orders} where ${orders.id} = ${table.orderId} and ${orders.userId} = auth.uid())` }),
]).enableRLS();

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("paystack"),
  reference: text("reference").notNull().unique(),
  status: paymentStatus("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("NGN"),
  providerData: jsonb("provider_data"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("payments_order_idx").on(table.orderId),
  pgPolicy("payments_owner_read", { for: "select", to: "authenticated", using: sql`exists (select 1 from ${orders} where ${orders.id} = ${table.orderId} and ${orders.userId} = auth.uid())` }),
]).enableRLS();

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent"),
  discountCents: integer("discount_cents"),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, () => [pgPolicy("coupons_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` })]).enableRLS();

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
}, () => [pgPolicy("newsletter_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` })]).enableRLS();

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, () => [pgPolicy("site_settings_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` })]).enableRLS();

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipient: text("recipient").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull(),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("email_logs_recipient_idx").on(table.recipient),
  pgPolicy("email_logs_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` }),
]).enableRLS();

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_entity_idx").on(table.entity, table.entityId),
  pgPolicy("audit_logs_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` }),
]).enableRLS();

export const adminUsers = pgTable("admin_users", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, () => [pgPolicy("admin_users_no_public_access", { for: "all", to: ["anon", "authenticated"], using: sql`false`, withCheck: sql`false` })]).enableRLS();
