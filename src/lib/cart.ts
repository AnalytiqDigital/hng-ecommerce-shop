export type PricedLine = { priceCents: number; quantity: number };

export function calculateSubtotal(lines: PricedLine[]) {
  if (lines.some((line) => !Number.isInteger(line.priceCents) || line.priceCents < 0 || !Number.isInteger(line.quantity) || line.quantity < 1)) {
    throw new Error("Cart lines must have non-negative integer prices and positive integer quantities.");
  }
  return lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);
}

export function validateRequestedStock(requested: number, available: number) {
  return Number.isInteger(requested) && requested > 0 && Number.isInteger(available) && requested <= available;
}