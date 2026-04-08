"use client";

import { useI18n } from "@/lib/i18n-context";
import type { Locale } from "@/i18n/translate";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  function select(next: Locale) {
    if (next !== locale) setLocale(next);
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-1 py-0.5 text-xs"
      role="group"
      aria-label={t("language.label")}
    >
      <button
        type="button"
        onClick={() => select("zh-Hant")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "zh-Hant"
            ? "bg-lulu-accent text-lulu-bg font-medium"
            : "text-white/80 hover:bg-white/10"
        }`}
      >
        {t("language.zh")}
      </button>
      <button
        type="button"
        onClick={() => select("en")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "en"
            ? "bg-lulu-accent text-lulu-bg font-medium"
            : "text-white/80 hover:bg-white/10"
        }`}
      >
        {t("language.en")}
      </button>
    </div>
  );
}
