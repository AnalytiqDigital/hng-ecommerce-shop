import "server-only";
type OrderConfirmationEmail = {
  to: string;
  customerName: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
};
function getEmailConfig() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    throw new Error("Google Apps Script email service is not configured.");
  }
  return { url, secret };
}
function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
export async function sendOrderConfirmationEmail(
  input: OrderConfirmationEmail,
) {
  const { url, secret } = getEmailConfig();
  const amount = formatAmount(input.totalCents, input.currency);
  const customerName = escapeHtml(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);
  const html = ` <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:24px"> <h1 style="margin:0 0 16px;font-size:28px;">Thank you for your order</h1> <p>Hello ${customerName},</p> <p> Your payment has been confirmed and your order is now being processed. </p> <div style="background:#f5f5f2;padding:18px;margin:24px 0;"> <p style="margin:0 0 8px;"> <strong>Order number:</strong> ${orderNumber} </p> <p style="margin:0;"> <strong>Total paid:</strong> ${escapeHtml(amount)} </p> </div> <p> Please keep your order number for your records. </p> <p> Thank you for shopping with Form &amp; Field. </p> </div> `;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      to: input.to,
      subject: `Order confirmation — ${input.orderNumber}`,
      html,
    }),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;
  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || `Email service returned HTTP ${response.status}.`,
    );
  }
  return { ok: true };
}
