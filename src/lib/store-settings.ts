import { z } from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(120),
  logoUrl: z.union([z.literal(""), z.url().startsWith("https://")]),
  announcement: z.string().trim().max(140),
  heroEyebrow: z.string().trim().max(100),
  heroTitle: z.string().trim().min(2).max(100),
  heroAccent: z.string().trim().max(100),
  heroBody: z.string().trim().max(300),
  heroImageUrl: z.url().startsWith("https://"),
  collectionEyebrow: z.string().trim().max(100),
  collectionTitle: z.string().trim().max(100),
  collectionBody: z.string().trim().max(300),
  aboutEyebrow: z.string().trim().max(100),
  aboutTitle: z.string().trim().max(100),
  aboutAccent: z.string().trim().max(100),
  aboutBody: z.string().trim().max(500),
  aboutImageUrl: z.url().startsWith("https://"),
  newsletterTitle: z.string().trim().max(100),
  newsletterBody: z.string().trim().max(200),
  contactEmail: z.email().max(254),
  contactPhone: z.string().trim().max(40),
  whatsappNumber: z.string().trim().max(32).refine((value) => {
    if (!value) return true;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, "Enter a WhatsApp number with country code."),
  contactAddress: z.string().trim().max(180),
  currency: z.enum(["NGN", "GHS", "ZAR", "USD"]),
  shippingFeeCents: z.number().int().min(0).max(100000000),
  freeShippingThresholdCents: z.number().int().min(0).max(1000000000),
  footerText: z.string().trim().max(240),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const defaultStoreSettings: StoreSettings = {
  storeName: "Form & Field",
  tagline: "Objects for everyday rituals",
  logoUrl: "",
  announcement: "Complimentary delivery on orders over ₦150,000",
  heroEyebrow: "The slower collection / no. 04",
  heroTitle: "Make room for",
  heroAccent: "the everyday.",
  heroBody: "Useful things, made with care. A small collection for living well with less, and keeping what matters close.",
  heroImageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=90",
  collectionEyebrow: "Objects with intention",
  collectionTitle: "The considered edit",
  collectionBody: "Good design does not ask for attention. It earns a place in your day, then stays.",
  aboutEyebrow: "Our point of view",
  aboutTitle: "Keep fewer things.",
  aboutAccent: "Choose them well.",
  aboutBody: "We work with independent makers who believe the objects around us should be useful, honest and a little bit beautiful. Made slowly, chosen carefully, lived with for a long time.",
  aboutImageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1500&q=85",
  newsletterTitle: "Good things, occasionally.",
  newsletterBody: "New arrivals, maker stories and a slower kind of inspiration.",
  contactEmail: "hello@formandfield.store",
  contactPhone: "",
  whatsappNumber: "",
  contactAddress: "",
  currency: "NGN",
  shippingFeeCents: 250000,
  freeShippingThresholdCents: 15000000,
  footerText: "Objects for everyday rituals. Thoughtfully sourced, made to be lived with.",
};

export function parseStoreSettings(value: unknown): StoreSettings {
  const parsed = storeSettingsSchema.partial().safeParse(value);
  return parsed.success ? { ...defaultStoreSettings, ...parsed.data } : defaultStoreSettings;
}