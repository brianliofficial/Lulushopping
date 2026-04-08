"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n-context";

type Props = {
  onOpenCart: () => void;
};

export function Header({ onOpenCart }: Props) {
  const { itemCount } = useCart();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-lulu-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-3 rounded-lg outline-offset-4 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lulu-accent">
            <Image
              src="/logo.png"
              alt="LULU"
              width={56}
              height={56}
              className="rounded-lg object-cover"
              priority
            />
            <div className="leading-tight">
              <p className="font-display text-xl font-bold tracking-wide text-white">
                LULU<span className="text-lulu-accent">.</span>
              </p>
              <p className="text-xs text-white/70">{t("hero.tagline")}</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/admin/orders"
            className="rounded-full border border-white/25 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            {t("header.orders")}
          </Link>
          <Link
            href="/admin/products"
            className="rounded-full border border-white/25 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            {t("header.products")}
          </Link>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 rounded-full bg-lulu-accent px-4 py-2 text-sm font-semibold text-lulu-bg shadow-md transition hover:bg-lulu-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lulu-accent"
            aria-label={t("a11y.cartItems", { count: itemCount })}
          >
            <span aria-hidden>{t("header.cart")}</span>
            {itemCount > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-lulu-bg px-1.5 text-xs text-white">
                {itemCount}
              </span>
            ) : null}
          </button>
        </nav>
      </div>
    </header>
  );
}
