"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useI18n } from "@/lib/i18n-context";

const STORAGE_KEY = "lulu-admin-secret-session";

type AdminAuthContextValue = {
  adminSecret: string;
  setAdminSecret: (value: string) => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminSecret(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminSecret must be used within AdminAuthProvider");
  }
  return ctx;
}

function AdminPasswordOverlay() {
  const { t } = useI18n();
  const { adminSecret, setAdminSecret } = useAdminSecret();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (adminSecret.trim()) return;
    setInput("");
  }, [adminSecret]);

  if (adminSecret.trim()) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-lulu-surface p-6 shadow-xl">
        <h2
          id="admin-gate-title"
          className="font-display text-lg font-semibold text-white"
        >
          {t("adminGate.title")}
        </h2>
        <p className="mt-2 text-sm text-white/75">{t("adminGate.body")}</p>
        <label htmlFor="admin-gate-password" className="mt-4 block text-xs text-white/60">
          {t("adminGate.passwordLabel")}
        </label>
        <input
          id="admin-gate-password"
          type="password"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = input.trim();
              if (v) setAdminSecret(v);
            }
          }}
          className="mt-1 w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white"
          placeholder={t("adminGate.passwordPh")}
        />
        <button
          type="button"
          disabled={!input.trim()}
          onClick={() => {
            const v = input.trim();
            if (v) setAdminSecret(v);
          }}
          className="mt-4 w-full rounded-full bg-lulu-accent py-2.5 text-sm font-semibold text-lulu-bg hover:bg-lulu-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("adminGate.continue")}
        </button>
      </div>
    </div>
  );
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminSecret, setAdminSecretState] = useState("");

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) setAdminSecretState(s);
    } catch {
      /* ignore */
    }
  }, []);

  const setAdminSecret = useCallback((value: string) => {
    setAdminSecretState(value);
    try {
      if (value.trim()) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ adminSecret, setAdminSecret }),
    [adminSecret, setAdminSecret],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      <AdminPasswordOverlay />
      <div
        className={
          !adminSecret.trim()
            ? "pointer-events-none min-h-[50vh] opacity-40"
            : undefined
        }
        aria-hidden={!adminSecret.trim() ? true : undefined}
      >
        {children}
      </div>
    </AdminAuthContext.Provider>
  );
}
