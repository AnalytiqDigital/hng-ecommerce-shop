import { asc } from "drizzle-orm";
import { CategoryCreateForm } from "@/components/admin/category-create-form";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export default async function AdminCategoriesPage() {
  const items = await getDb().select().from(categories).orderBy(asc(categories.name));
  return <><p className="text-[10px] uppercase tracking-[0.18em] text-clay">Catalog structure</p><h1 className="mt-2 font-display text-[38px]">Categories</h1><p className="mt-2 text-[12px] text-muted">Manage the groups used to organize the shop.</p><CategoryCreateForm /><div className="mt-8 border-t border-line">{items.map((category) => <div key={category.id} className="grid grid-cols-2 gap-3 border-b border-line py-4 text-[12px] sm:grid-cols-4"><span className="font-medium">{category.name}</span><span className="text-muted">/{category.slug}</span><span className="text-muted">{category.active ? "Published" : "Archived"}</span><span className="text-right text-muted">{category.description}</span></div>)}</div></>;
}