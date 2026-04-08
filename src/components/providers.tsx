"use client";

import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CartProvider>{children}</CartProvider>
    </I18nProvider>
  );
}
