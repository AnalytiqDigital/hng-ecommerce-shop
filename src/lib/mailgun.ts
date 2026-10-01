import "server-only";

import { getDb } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export async function sendOrderConfirmationEmail(input: {
  orderNumber: string;
  recipient: string;
  customerName: string;
  totalCents: number;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
}) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM_EMAIL;
  if (!key || !domain || !from) return { sent: false, reason: "Mailgun is not configured." };

  const amount = (cents: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(cents / 100);
  const rows = input.items.map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e4e4dc">${escapeHtml(item.name)} × ${item.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #e4e4dc;text-align:right">${amount(item.unitPriceCents * item.quantity)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#242823;max-width:600px;margin:auto"><p style="text-transform:uppercase;letter-spacing:2px;color:#b85f43;font-size:11px">Form & Field</p><h1 style="font-family:Georgia,serif;font-weight:400">Thank you, ${escapeHtml(input.customerName)}.</h1><p>Your order <strong>${escapeHtml(input.orderNumber)}</strong> is confirmed. We will send another note when it is on its way.</p><table style="width:100%;border-collapse:collapse">${rows}<tr><td style="padding-top:18px">Total</td><td style="padding-top:18px;text-align:right"><strong>${amount(input.totalCents)}</strong></td></tr></table><p style="margin-top:32px;color:#70766e;font-size:12px">Questions? Reply to this email or contact hello@formandfield.store.</p></div>`;
  const form = new FormData();
  form.set("from", from);
  form.set("to", input.recipient);
  form.set("subject", `Order ${input.orderNumber} is confirmed`);
  form.set("html", html);

  let status = "failed";
  let providerMessageId: string | undefined;
  let errorText: string | undefined;
  try {
    const response = await fetch(`https://api.mailgun.net/v3/${encodeURIComponent(domain)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` },
      body: form,
    });
    const result = await response.json() as { id?: string; message?: string };
    if (!response.ok) throw new Error(result.message ?? `Mailgun returned ${response.status}`);
    status = "sent";
    providerMessageId = result.id;
  } catch (error) {
    errorText = error instanceof Error ? error.message : "Mailgun request failed";
  }

  try {
    await getDb().insert(emailLogs).values({
      recipient: input.recipient,
      template: "order-confirmation",
      status,
      providerMessageId,
      error: errorText,
    });
  } catch {
    // Email delivery must not change the already-committed payment result.
  }
  return { sent: status === "sent", reason: errorText };
}