import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { HomeReturnLink } from "@/components/home-return-link";
import { StoreSettingsProvider } from "@/components/store-settings-provider";
import { WhatsAppChat } from "@/components/whatsapp-chat";
import { getStoreSettings } from "@/lib/store-settings.server";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: `${settings.storeName} | ${settings.tagline}`,
    description: settings.heroBody,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning><StoreSettingsProvider><HomeReturnLink /><CartProvider>{children}<WhatsAppChat /></CartProvider></StoreSettingsProvider></body>
    </html>
  );
}
