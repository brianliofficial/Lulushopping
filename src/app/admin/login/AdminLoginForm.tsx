"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useI18n } from "@/lib/i18n-context";

export function AdminLoginForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/products";

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-white">
        {t("adminLogin.title")}
      </h1>
      <p className="mt-2 text-sm text-white/75">{t("adminLogin.subtitle")}</p>
      {err ? (
        <p
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {t("adminLogin.errorAccessDenied")}
        </p>
      ) : null}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl })}
          className="w-full rounded-full bg-lulu-accent py-2.5 text-sm font-semibold text-lulu-bg hover:bg-lulu-accent-muted"
        >
          {t("adminLogin.signInWithGoogle")}
        </button>
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm text-white/70 underline hover:text-white"
      >
        {t("adminLogin.backHome")}
      </Link>
    </>
  );
}
