"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMessages,
  getStoredLocale,
  persistLocale,
  translate,
  type Locale,
} from "@/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-Hant");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored) setLocaleState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === "en" ? "en" : "zh-Hant";
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo(() => {
    const messages = getMessages(locale);
    return {
      locale,
      setLocale,
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(messages, key, vars),
    };
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
