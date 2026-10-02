import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const category = new URL(request.url).searchParams.get("category") ?? undefined;
    return NextResponse.json({ products: await getProducts(category) });
  } catch (error) {
    const detail = error as { code?: string };
    console.error("[CATALOG] Product query failed", {
      code: detail.code ?? "unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to load products." }, { status: 503 });
  }
}