import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

export async function GET() {
  const recipient = process.env.ADMIN_EMAIL;

  if (!recipient) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL is not configured" },
      { status: 500 }
    );
  }

  const result = await sendOrderConfirmationEmail({
    orderNumber: "MAILGUN-TEST-001",
    recipient,
    customerName: "Test Customer",
    totalCents: 150000,
    items: [
      {
        name: "Test Product",
        quantity: 2,
        unitPriceCents: 75000,
      },
    ],
  });

  return NextResponse.json(result);
}