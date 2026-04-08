"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

function resolveApiMessage(
  code: string | undefined,
  raw: string | undefined,
  t: (key: string) => string,
): string {
  if (code) {
    const key = `errors.order.${code}`;
    const msg = t(key);
    if (msg !== key) return msg;
  }
  if (raw) return raw;
  return t("errors.order.GENERIC");
}

export function CheckoutForm({ onSuccess, onCancel }: Props) {
  const { lines, subtotal, clear } = useCart();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [last5, setLast5] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError(t("checkout.clientEmptyCart"));
      return;
    }
    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: Math.round(l.quantity * l.unitPrice * 100) / 100,
      }));
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          transferLast5: last5.trim(),
          items,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setError(resolveApiMessage(data.code, data.error, t));
        return;
      }
      clear();
      setName("");
      setPhone("");
      setLast5("");
      onSuccess();
    } catch {
      setError(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 border-t border-white/10 pt-4"
      noValidate
    >
      <h3 className="font-display text-lg font-semibold text-white">
        {t("checkout.title")}
      </h3>
      <p className="text-sm text-white/70">{t("checkout.blurb")}</p>
      <div>
        <label htmlFor="checkout-name" className="mb-1 block text-sm text-white/90">
          {t("checkout.name")}
        </label>
        <input
          id="checkout-name"
          name="customerName"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder={t("checkout.namePh")}
        />
      </div>
      <div>
        <label htmlFor="checkout-phone" className="mb-1 block text-sm text-white/90">
          {t("checkout.phone")}
        </label>
        <input
          id="checkout-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder={t("checkout.phonePh")}
        />
      </div>
      <div>
        <label htmlFor="checkout-last5" className="mb-1 block text-sm text-white/90">
          {t("checkout.transferLast5")}
        </label>
        <input
          id="checkout-last5"
          name="transferLast5"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          required
          value={last5}
          onChange={(e) =>
            setLast5(e.target.value.replace(/\D/g, "").slice(0, 5))
          }
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 tracking-widest text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder="12345"
          aria-describedby="last5-hint"
        />
        <p id="last5-hint" className="mt-1 text-xs text-white/50">
          {t("checkout.last5Hint")}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-lulu-bg/80 px-3 py-2 text-white">
        <span className="text-white/80">{t("checkout.total")}</span>
        <span className="font-semibold tabular-nums">NT$ {subtotal}</span>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
        >
          {t("checkout.back")}
        </button>
        <button
          type="submit"
          disabled={submitting || lines.length === 0}
          className="rounded-full bg-lulu-accent px-5 py-2 text-sm font-semibold text-lulu-bg shadow hover:bg-lulu-accent-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lulu-accent"
        >
          {submitting ? t("checkout.submitting") : t("checkout.submit")}
        </button>
      </div>
    </form>
  );
}
