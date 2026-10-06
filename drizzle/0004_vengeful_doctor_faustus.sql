DROP INDEX "cart_product_unique";--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_product_variant_unique" ON "cart_items" USING btree ("cart_id","product_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_user_unique" ON "carts" USING btree ("user_id");