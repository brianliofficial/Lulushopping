"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { isValidUkMobile } from "@/lib/phone-uk";
import { isValidUkPostcodeFormat, normalizeUkPostcode } from "@/lib/postcode-uk";

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
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [pcSuggestions, setPcSuggestions] = useState<string[]>([]);
  const [pcOpen, setPcOpen] = useState(false);
  const pcWrapRef = useRef<HTMLDivElement>(null);
  const [premiseSuggestions, setPremiseSuggestions] = useState<
    { id: string; address: string }[]
  >([]);
  const [premiseLoading, setPremiseLoading] = useState(false);
  const [selectedPremiseId, setSelectedPremiseId] = useState("");
  /** null = not loaded yet; false = no GETADDRESS_API_KEY; true = key present */
  const [getAddressConfigured, setGetAddressConfigured] = useState<
    boolean | null
  >(null);
  const [last5, setLast5] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = postcode.trim();
    if (q.length < 2) {
      setPcSuggestions([]);
      return;
    }
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/postcode/autocomplete?q=${encodeURIComponent(q)}`,
        );
        const data = (await res.json()) as { results?: string[] };
        setPcSuggestions(Array.isArray(data.results) ? data.results : []);
      } catch {
        setPcSuggestions([]);
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [postcode]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!pcWrapRef.current?.contains(e.target as Node)) setPcOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const raw = postcode.trim();
    if (!raw) {
      setPremiseSuggestions([]);
      setGetAddressConfigured(null);
      return;
    }
    const norm = normalizeUkPostcode(raw);
    if (!isValidUkPostcodeFormat(raw) && !isValidUkPostcodeFormat(norm)) {
      setPremiseSuggestions([]);
      setGetAddressConfigured(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setPremiseLoading(true);
      try {
        const sRes = await fetch(
          `/api/address/suggest?q=${encodeURIComponent(norm)}`,
        );
        const sData = (await sRes.json()) as {
          configured?: boolean;
          suggestions?: { id: string; address: string }[];
        };
        const list = Array.isArray(sData.suggestions) ? sData.suggestions : [];
        setGetAddressConfigured(sData.configured === true);
        if (sData.configured && list.length > 0) {
          setPremiseSuggestions(list);
          setSelectedPremiseId("");
          return;
        }
        setPremiseSuggestions([]);
        setSelectedPremiseId("");
        const lRes = await fetch(
          `/api/postcode/lookup?q=${encodeURIComponent(norm)}`,
        );
        if (!lRes.ok) return;
        const d = (await lRes.json()) as {
          addressLine1?: string;
          addressLine2?: string;
          city?: string;
        };
        if (typeof d.city === "string" && d.city.trim()) {
          setCity(d.city.trim());
        }
        setAddressLine1(
          typeof d.addressLine1 === "string" ? d.addressLine1.trim() : "",
        );
        setAddressLine2(
          typeof d.addressLine2 === "string" ? d.addressLine2.trim() : "",
        );
      } catch {
        /* optional */
      } finally {
        setPremiseLoading(false);
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [postcode]);

  async function applyPremise(id: string) {
    setSelectedPremiseId(id);
    if (!id) return;
    try {
      const res = await fetch(
        `/api/address/detail?id=${encodeURIComponent(id)}`,
      );
      if (!res.ok) return;
      const d = (await res.json()) as {
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        postcode?: string;
      };
      setAddressLine1(String(d.addressLine1 ?? "").trim());
      setAddressLine2(String(d.addressLine2 ?? "").trim());
      setCity(String(d.city ?? "").trim());
      if (d.postcode?.trim()) {
        setPostcode(d.postcode.trim());
      }
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError(t("checkout.clientEmptyCart"));
      return;
    }
    if (!isValidUkMobile(phone.trim())) {
      setError(t("errors.order.INVALID_PHONE"));
      return;
    }
    if (!addressLine1.trim()) {
      setError(t("errors.order.ADDRESS_REQUIRED"));
      return;
    }
    if (!city.trim()) {
      setError(t("errors.order.CITY_REQUIRED"));
      return;
    }
    const pcNorm = normalizeUkPostcode(postcode);
    if (!postcode.trim() || !isValidUkPostcodeFormat(postcode) || !isValidUkPostcodeFormat(pcNorm)) {
      setError(t("errors.order.INVALID_POSTCODE"));
      return;
    }
    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
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
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          postcode: pcNorm,
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
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setPostcode("");
      setPremiseSuggestions([]);
      setSelectedPremiseId("");
      setGetAddressConfigured(null);
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
      <div ref={pcWrapRef} className="relative">
        <label htmlFor="checkout-postcode" className="mb-1 block text-sm text-white/90">
          {t("checkout.postcode")}
        </label>
        <input
          id="checkout-postcode"
          name="postcode"
          type="text"
          autoComplete="postal-code"
          required
          value={postcode}
          onChange={(e) => {
            setPostcode(e.target.value);
            setPcOpen(true);
            setPremiseSuggestions([]);
            setSelectedPremiseId("");
            setGetAddressConfigured(null);
          }}
          onFocus={() => setPcOpen(true)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder="SW1A 1AA"
          aria-autocomplete="list"
          aria-expanded={pcOpen && pcSuggestions.length > 0}
        />
        <p className="mt-1 text-xs text-white/50">{t("checkout.postcodeHint")}</p>
        {pcOpen && pcSuggestions.length > 0 ? (
          <ul
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-white/15 bg-lulu-bg py-1 text-sm shadow-lg"
            role="listbox"
          >
            {pcSuggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-white hover:bg-white/10"
                  onClick={() => {
                    setPostcode(s);
                    setPcOpen(false);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {premiseLoading ? (
        <p className="text-xs text-white/60">{t("checkout.premiseLoading")}</p>
      ) : null}
      {premiseSuggestions.length > 0 ? (
        <div>
          <label
            htmlFor="checkout-premise"
            className="mb-1 block text-sm text-white/90"
          >
            {t("checkout.selectPremise")}
          </label>
          <select
            id="checkout-premise"
            value={selectedPremiseId}
            onChange={(e) => void applyPremise(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          >
            <option value="">{t("checkout.premisePlaceholder")}</option>
            {premiseSuggestions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.address}
              </option>
            ))}
          </select>
          <p
            className="mt-1 text-xs text-white/50"
            dangerouslySetInnerHTML={{ __html: t("checkout.premiseHelp") }}
          />
        </div>
      ) : null}
      {!premiseLoading &&
      getAddressConfigured === false &&
      premiseSuggestions.length === 0 ? (
        <p className="text-xs text-white/40">{t("checkout.getaddressNote")}</p>
      ) : null}
      <div>
        <label htmlFor="checkout-a1" className="mb-1 block text-sm text-white/90">
          {t("checkout.addressLine1")}
        </label>
        <input
          id="checkout-a1"
          name="addressLine1"
          type="text"
          autoComplete="address-line1"
          required
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder={t("checkout.addressLine1Ph")}
        />
      </div>
      <div>
        <label htmlFor="checkout-a2" className="mb-1 block text-sm text-white/90">
          {t("checkout.addressLine2")}
        </label>
        <input
          id="checkout-a2"
          name="addressLine2"
          type="text"
          autoComplete="address-line2"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder={t("checkout.addressLine2Ph")}
        />
      </div>
      <div>
        <label htmlFor="checkout-city" className="mb-1 block text-sm text-white/90">
          {t("checkout.city")}
        </label>
        <input
          id="checkout-city"
          name="city"
          type="text"
          autoComplete="address-level2"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-lulu-bg px-3 py-2 text-white placeholder:text-white/40 focus:border-lulu-accent focus:outline-none focus:ring-1 focus:ring-lulu-accent"
          placeholder={t("checkout.cityPh")}
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
          placeholder={t("checkout.last5Ph")}
          aria-describedby="last5-hint"
        />
        <p id="last5-hint" className="mt-1 text-xs text-white/50">
          {t("checkout.last5Hint")}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-lulu-bg/80 px-3 py-2 text-white">
        <span className="text-white/80">{t("checkout.total")}</span>
        <span className="font-semibold tabular-nums">£{subtotal}</span>
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
