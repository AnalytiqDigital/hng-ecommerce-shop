import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

const emailSchema = z.object({ email: z.email().max(254) });

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Newsletter signup is temporarily unavailable." }, { status: 503 });
  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  try {
    await getDb().insert(newsletterSubscribers).values({ email: parsed.data.email.trim().toLowerCase() }).onConflictDoNothing({ target: newsletterSubscribers.email });
    return NextResponse.json({ subscribed: true });
  } catch {
    return NextResponse.json({ error: "Newsletter signup is temporarily unavailable." }, { status: 503 });
  }
}