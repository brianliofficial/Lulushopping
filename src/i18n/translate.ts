import type { Messages } from "./messages/en";
import { en } from "./messages/en";
import { zhHant } from "./messages/zh-Hant";

export type Locale = "zh-Hant" | "en";

const STORAGE_KEY = "lulu-locale";

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "en" || s === "zh-Hant") return s;
  } catch {
    /* ignore */
  }
  return null;
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function getMessages(locale: Locale): Messages {
  return locale === "en" ? en : zhHant;
}

/** Dot path e.g. `header.cart` or `errors.order.EMPTY_NAME` */
export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  if (typeof cur !== "string") return key;
  let s = cur;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return s;
}
