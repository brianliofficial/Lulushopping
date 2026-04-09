"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import type { HomeConfigErrorCode, HomeErrorCode } from "@/components/HomeShell";

type Props = {
  products: Product[];
  loading?: boolean;
  errorCode?: HomeErrorCode | null;
  configErrorCode?: HomeConfigErrorCode | null;
  /** When false, add-to-cart is disabled (outside sale window). */
  shoppingAllowed?: boolean;
};

export function ProductList({
  products,
  loading,
  errorCode,
  configErrorCode,
  shoppingAllowed = true,
}: Props) {
  const { addProduct } = useCart();
  const { t } = useI18n();
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  function getQty(id: string): number {
    return qtyMap[id] ?? 1;
  }

  function setQty(id: string, value: number) {
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, value) }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-lulu-surface/80 p-8 text-center text-white/80">
        {t("productList.loading")}
      </div>
    );
  }

  if (configErrorCode) {
    return (
      <div
        className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-6 text-amber-100"
        role="alert"
      >
        <p className="font-medium">{t("productList.configErrorTitle")}</p>
        <p
          className="mt-2 text-sm text-amber-100/90"
          dangerouslySetInnerHTML={{
            __html: t(`errors.home.${configErrorCode}`),
          }}
        />
      </div>
    );
  }

  if (errorCode) {
    return (
      <div
        className="rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-red-100"
        role="alert"
      >
        <p className="font-medium">{t("productList.fetchErrorTitle")}</p>
        <p className="mt-2 text-sm">{t(`errors.home.${errorCode}`)}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-lulu-surface/80 p-8 text-center text-white/80">
        <p>{t("productList.emptyTitle")}</p>
        <p
          className="mt-2 text-sm text-white/60"
          dangerouslySetInnerHTML={{ __html: t("productList.emptyHint") }}
        />
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {products.map((p) => {
        const q = getQty(p.id);
        const max = p.maxQty;
        const soldOut = max < 1;
        const addBlocked = soldOut || !shoppingAllowed;
        return (
          <li
            key={p.id}
            className="overflow-hidden rounded-2xl border border-white/15 bg-lulu-surface/90 shadow-lg shadow-black/20"
          >
            <div className="flex justify-center px-3 pt-3">
              <div className="relative aspect-square w-full max-w-[280px] min-h-[200px] min-w-[200px] overflow-hidden rounded-xl border border-white/15 bg-black/25">
                {p.imageUrl?.trim() ? (
                  <img
                    src={p.imageUrl.trim()}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-full min-h-[200px] w-full items-center justify-center bg-gradient-to-b from-white/5 to-white/[0.02] text-xs text-white/45"
                    aria-hidden
                  >
                    {t("productList.noImage")}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3 p-4">
              <h3 className="text-base font-semibold leading-snug text-white">
                {p.name}
              </h3>
              {p.description?.trim() ? (
                <p className="text-sm text-white/75 line-clamp-6 whitespace-pre-wrap">
                  {p.description}
                </p>
              ) : (
                <p className="text-xs text-white/40">
                  {t("productList.noDescription")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                <span className="tabular-nums">£{p.price} ×</span>
                <label className="sr-only" htmlFor={`qty-${p.id}`}>
                  {t("productList.qtySrOnly", { name: p.name })}
                </label>
                <input
                  id={`qty-${p.id}`}
                  type="number"
                  min={1}
                  max={max}
                  value={soldOut ? 0 : q}
                  disabled={addBlocked}
                  onChange={(e) =>
                    setQty(
                      p.id,
                      Math.min(max, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  className="w-16 rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-white focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-white/60">
                  {soldOut
                    ? t("productList.soldOutBadge")
                    : t("productList.remaining", { max })}
                </span>
              </div>
              {!shoppingAllowed && !soldOut ? (
                <p className="text-xs text-amber-200/90">{t("productList.outsideSaleWindow")}</p>
              ) : null}
              <button
                type="button"
                onClick={() => addProduct(p, q)}
                disabled={addBlocked}
                className="w-full rounded-full bg-lulu-accent py-3 text-sm font-semibold text-lulu-bg shadow transition hover:bg-lulu-accent-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lulu-accent"
              >
                {soldOut
                  ? t("productList.soldOut")
                  : !shoppingAllowed
                    ? t("productList.addToCartClosed")
                    : t("productList.addToCart")}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
