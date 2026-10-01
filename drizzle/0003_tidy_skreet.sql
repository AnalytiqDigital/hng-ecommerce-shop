CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color_hex" text NOT NULL,
	"sku" text NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variant_color_hex_valid" CHECK ("product_variants"."color_hex" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "product_variant_stock_nonnegative" CHECK ("product_variants"."stock_quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_name" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_color_hex" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_name_unique" ON "product_variants" USING btree ("product_id","name");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "product_variants_public_active_read" ON "product_variants" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("product_variants"."active" = true and exists (select 1 from "products" where "products"."id" = "product_variants"."product_id" and "products"."status" = 'published'));