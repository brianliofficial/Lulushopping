"use client";

import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n-context";
import type { Locale } from "@/i18n/translate";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <CartProvider>{children}</CartProvider>
    </I18nProvider>
  );
}
