import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const category = new URL(request.url).searchParams.get("category") ?? undefined;
    return NextResponse.json({ products: await getProducts(category) });
  } catch {
    return NextResponse.json({ error: "Unable to load products." }, { status: 503 });
  }
}