import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearUserCart,
  getUserCart,
  replaceUserCart,
} from "@/lib/cart-store";
import { getRequestUser } from "@/lib/supabase/request-user";

const cartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().min(1).max(20),
    }),
  ).max(30),
});

async function authenticatedUser(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Sign in to sync your cart." }, { status: 401 }),
    };
  }
  if (!process.env.DATABASE_URL) {
    return {
      user: null,
      response: NextResponse.json({ error: "Cart sync is unavailable until a database is configured." }, { status: 503 }),
    };
  }
  return { user, response: null };
}

export async function GET(request: Request) {
  try {
    const auth = await authenticatedUser(request);
    if (!auth.user) return auth.response;
    return NextResponse.json({ items: await getUserCart(auth.user.id) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load your saved cart." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticatedUser(request);
  if (!auth.user) return auth.response;
  const parsed = cartSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Cart items or quantities are invalid." }, { status: 400 });
  }
  try {
    const items = await replaceUserCart(auth.user.id, parsed.data.items);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your cart.";
    const expected = /no longer available|does not have enough stock|requires a color selection|color is no longer available|cannot exceed/i.test(message);
    return NextResponse.json(
      { error: expected ? message : "Unable to save your cart right now." },
      { status: expected ? 409 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticatedUser(request);
    if (!auth.user) return auth.response;
    await clearUserCart(auth.user.id);
    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ error: "Unable to clear your saved cart." }, { status: 500 });
  }
}
