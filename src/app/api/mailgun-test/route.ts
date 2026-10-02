import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM_EMAIL;
  const recipient = process.env.ADMIN_EMAIL;

  if (!key || !domain || !from || !recipient) {
    return NextResponse.json(
      {
        configured: {
          key: !!key,
          domain: !!domain,
          from: !!from,
          recipient: !!recipient,
        },
      },
      { status: 500 }
    );
  }

  const form = new FormData();
  form.set("from", from);
  form.set("to", recipient);
  form.set("subject", "HNG Mailgun Test");
  form.set(
    "text",
    "This is a test email from the HNG E-Commerce application."
  );

  const response = await fetch(
    `https://api.mailgun.net/v3/${encodeURIComponent(domain)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}`,
      },
      body: form,
    }
  );

  const body = await response.text();

  return NextResponse.json({
    status: response.status,
    ok: response.ok,
    mailgunResponse: body,
  });
}