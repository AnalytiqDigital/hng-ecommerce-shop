export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", message.trim() || "Hello, I have a question.");
  return url.toString();
}