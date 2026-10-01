"use client";

import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultStoreSettings, type StoreSettings } from "@/lib/store-settings";

type ContextValue = { settings: StoreSettings; refresh: () => Promise<void> };
const SettingsContext = createContext<ContextValue | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultStoreSettings);
  async function refresh() {
    try {
      const response = await fetch("/api/store-settings", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as { settings?: StoreSettings };
      if (result.settings) startTransition(() => setSettings(result.settings!));
    } catch {
      // Keep the validated defaults available when the database is not configured.
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>;
}

export function useStoreSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useStoreSettings must be used inside StoreSettingsProvider");
  return context;
}