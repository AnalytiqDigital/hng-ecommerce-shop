import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidPaystackSignature(body: Buffer, signature: string, secret: string) {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(body).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isMatchingSuccessfulPayment(input: {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
}, expected: { reference: string; amount: number; currency: string }) {
  return input.status === "success"
    && input.reference === expected.reference
    && input.amount === expected.amount
    && input.currency === expected.currency;
}