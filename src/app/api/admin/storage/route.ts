import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const access = await authorizeAdmin();
  if (!access.user) return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Supabase Storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, WebP, or AVIF image up to 5 MB." }, { status: 400 });
  }
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "store-assets";
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Image could not be uploaded. Check that the storage bucket exists." }, { status: 502 });
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}