"use client";

import { useI18n } from "@/lib/i18n-context";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-lulu-accent focus:px-4 focus:py-2 focus:text-lulu-bg"
    >
      {t("a11y.skipToContent")}
    </a>
  );
}
