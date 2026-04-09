"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { CheckoutForm } from "@/components/CheckoutForm";
import { useI18n } from "@/lib/i18n-context";

export type CartStep = "cart" | "checkout" | "done";

type Props = {
  open: boolean;
  step: CartStep;
  onStepChange: (step: CartStep) => void;
  onClose: () => void;
  /** False when sale window is closed (before start or after end). */
  shoppingAllowed?: boolean;
};

export function CartDrawer({
  open,
  step,
  onStepChange,
  onClose,
  shoppingAllowed = true,
}: Props) {
  const { lines, subtotal, setLineQuantity, removeLine } = useCart();
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title =
    step === "done"
      ? t("cart.titleDone")
      : step === "checkout"
        ? t("cart.titleCheckout")
        : t("cart.titleCart");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={t("cart.backdropClose")}
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-lulu-bg shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="cart-title" className="font-display text-lg font-bold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            aria-label={t("a11y.closeDialog")}
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          {step === "done" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="text-lg font-medium text-white">{t("cart.thanks")}</p>
              <p className="text-sm text-white/75">{t("cart.thanksDetail")}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-lulu-accent px-6 py-2.5 text-sm font-semibold text-lulu-bg hover:bg-lulu-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lulu-accent"
              >
                {t("cart.close")}
              </button>
            </div>
          ) : step === "checkout" ? (
            <CheckoutForm
              onSuccess={() => onStepChange("done")}
              onCancel={() => onStepChange("cart")}
              checkoutDisabled={!shoppingAllowed}
            />
          ) : (
            <>
              {lines.length === 0 ? (
                <p className="py-8 text-center text-white/70">{t("cart.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lines.map((line) => (
                    <li
                      key={line.productId}
                      className="rounded-xl border border-white/15 bg-lulu-surface/90 p-3 shadow-md shadow-black/15"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                          {line.imageUrl?.trim() ? (
                            <img
                              src={line.imageUrl.trim()}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-[10px] text-white/40"
                              aria-hidden
                            >
                              {t("cart.noImage")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold leading-snug text-white">
                              {line.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLine(line.productId)}
                              className="shrink-0 rounded-full px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/15 hover:underline"
                            >
                              {t("cart.remove")}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                            <span className="tabular-nums">£{line.unitPrice} ×</span>
                            <label className="sr-only" htmlFor={`cart-qty-${line.productId}`}>
                              {t("cart.qty")}
                            </label>
                            <input
                              id={`cart-qty-${line.productId}`}
                              type="number"
                              min={1}
                              max={line.maxQty}
                              value={line.quantity}
                              onChange={(e) =>
                                setLineQuantity(
                                  line.productId,
                                  Number(e.target.value) || 1,
                                )
                              }
                              className="w-16 rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-white"
                            />
                            <span className="text-white/60">
                              {t("cart.remaining", { n: line.maxQty })}
                            </span>
                            <span className="ml-auto font-semibold tabular-nums text-lulu-accent">
                              £
                              {Math.round(line.quantity * line.unitPrice * 100) / 100}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {lines.length > 0 ? (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="mb-4 flex justify-between text-white">
                    <span className="text-white/80">{t("cart.subtotal")}</span>
                    <span className="font-semibold tabular-nums">£{subtotal}</span>
                  </div>
                  {!shoppingAllowed ? (
                    <p
                      className="mb-3 rounded-lg border border-amber-500/35 bg-amber-950/30 p-3 text-center text-sm text-amber-100/95"
                      role="status"
                    >
                      {t("cart.checkoutDisabledHint")}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={!shoppingAllowed}
                    onClick={() => onStepChange("checkout")}
                    className="w-full rounded-full bg-lulu-accent py-3 text-sm font-semibold text-lulu-bg shadow hover:bg-lulu-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lulu-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("cart.checkout")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
