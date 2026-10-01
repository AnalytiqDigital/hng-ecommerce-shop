ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_nonnegative" CHECK ("order_items"."unit_price_cents" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_nonnegative" CHECK ("orders"."subtotal_cents" >= 0 and "orders"."shipping_cents" >= 0 and "orders"."discount_cents" >= 0 and "orders"."total_cents" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_nonnegative" CHECK ("products"."price_cents" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonnegative" CHECK ("products"."stock_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_compare_price_valid" CHECK ("products"."compare_at_price_cents" is null or "products"."compare_at_price_cents" >= "products"."price_cents");