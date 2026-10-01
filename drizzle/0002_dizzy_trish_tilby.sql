ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "addresses_owner_read" ON "addresses" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("addresses"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "admin_users_no_public_access" ON "admin_users" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "audit_logs_no_public_access" ON "audit_logs" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "cart_items_owner_read" ON "cart_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "carts" where "carts"."id" = "cart_items"."cart_id" and "carts"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "carts_owner_read" ON "carts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("carts"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "categories_public_active_read" ON "categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("categories"."active" = true);--> statement-breakpoint
CREATE POLICY "coupons_no_public_access" ON "coupons" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "email_logs_no_public_access" ON "email_logs" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "newsletter_no_public_access" ON "newsletter_subscribers" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "order_items_owner_read" ON "order_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "orders" where "orders"."id" = "order_items"."order_id" and "orders"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "orders_owner_read" ON "orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("orders"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "payments_owner_read" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "orders" where "orders"."id" = "payments"."order_id" and "orders"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "product_images_public_published_read" ON "product_images" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from "products" where "products"."id" = "product_images"."product_id" and "products"."status" = 'published'));--> statement-breakpoint
CREATE POLICY "products_public_published_read" ON "products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("products"."status" = 'published');--> statement-breakpoint
CREATE POLICY "profiles_owner_read" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = auth.uid());--> statement-breakpoint
CREATE POLICY "site_settings_no_public_access" ON "site_settings" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);