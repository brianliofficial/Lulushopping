"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderLinePayload } from "@/lib/types";
import type { OrderRow } from "@/lib/orders-supabase";
import { useAdminSecret } from "@/components/AdminAuthProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n-context";

function formatItems(items: OrderLinePayload[] | unknown): string {
  if (!Array.isArray(items)) return "—";
  return items
    .map(
      (l: OrderLinePayload) =>
        `${l.name} ×${l.quantity}（${l.lineTotal}）`,
    )
    .join("；");
}

function formatDelivery(o: OrderRow): string {
  const parts = [o.address_line1, o.address_line2, o.city, o.postcode].filter(
    (s) => String(s ?? "").trim(),
  );
  return parts.length > 0 ? parts.join(", ") : "—";
}

function resolveAdminError(
  code: string | undefined,
  raw: string | undefined,
  t: (k: string) => string,
): string {
  if (code) {
    const key = `errors.admin.${code}`;
    const msg = t(key);
    if (msg !== key) return msg;
  }
  if (raw) return raw;
  return t("errors.admin.LOAD_FAILED");
}

export function AdminOrdersPanel() {
  const { t, locale } = useI18n();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { adminSecret, setAdminSecret } = useAdminSecret();
  const secretRef = useRef(adminSecret);
  secretRef.current = adminSecret;

  const [err, setErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const h: HeadersInit = {};
    const s = secretRef.current.trim();
    if (s) {
      h.Authorization = `Bearer ${s}`;
    }
    return h;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: authHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as {
        orders?: OrderRow[];
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setErr(resolveAdminError(data.code, data.error, t));
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setErr(t("errors.network"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteAllOrders() {
    const ok = window.confirm(t("adminOrders.confirmDeleteAll"));
    if (!ok) return;
    setUpdating("__all__");
    setErr(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setErr(resolveAdminError(data.code, data.error, t));
        return;
      }
      await load();
    } catch {
      setErr(t("errors.network"));
    } finally {
      setUpdating(null);
    }
  }

  async function setPaid(id: string, paid: boolean) {
    setUpdating(id + "p");
    setErr(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paid }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setErr(resolveAdminError(data.code, data.error, t));
        return;
      }
      await load();
    } catch {
      setErr(t("errors.network"));
    } finally {
      setUpdating(null);
    }
  }

  async function setPickedUp(id: string, picked_up: boolean) {
    setUpdating(id + "u");
    setErr(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ picked_up }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setErr(resolveAdminError(data.code, data.error, t));
        return;
      }
      await load();
    } catch {
      setErr(t("errors.network"));
    } finally {
      setUpdating(null);
    }
  }

  const dateLocale = locale === "en" ? "en-US" : "zh-TW";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          {t("adminOrders.pageTitle")}
        </h1>
        <p
          className="mt-2 text-sm text-white/75"
          dangerouslySetInnerHTML={{ __html: t("adminOrders.pageSubtitle") }}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-lulu-surface/50 p-4 text-sm text-white/85">
        <p dangerouslySetInnerHTML={{ __html: t("adminOrders.intro") }} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <LanguageSwitcher />
        <div className="min-w-[200px] flex-1">
          <label htmlFor="orders-admin-secret" className="mb-0.5 block text-xs text-white/60">
            {t("adminOrders.adminPassword")}
          </label>
          <input
            id="orders-admin-secret"
            type="password"
            autoComplete="off"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
            placeholder={t("adminOrders.passwordPh")}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          {t("adminOrders.reload")}
        </button>
        <button
          type="button"
          disabled={updating !== null || loading}
          onClick={() => void deleteAllOrders()}
          className="rounded-full border border-red-400/60 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15 disabled:opacity-50"
        >
          {updating === "__all__" ? t("adminOrders.deletingAll") : t("adminOrders.deleteAll")}
        </button>
        <Link
          href="/admin/products"
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          {t("adminOrders.productsLink")}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          {t("adminOrders.homeLink")}
        </Link>
      </div>

      {err ? (
        <p className="text-sm text-red-300" role="alert">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-white/70">{t("adminOrders.loading")}</p>
      ) : orders.length === 0 ? (
        <p className="text-white/60">{t("adminOrders.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[900px] text-left text-sm text-white">
            <thead className="bg-lulu-bg/90 text-xs uppercase text-white/90">
              <tr>
                <th className="px-3 py-2">{t("adminOrders.thTime")}</th>
                <th className="px-3 py-2">{t("adminOrders.thName")}</th>
                <th className="px-3 py-2">{t("adminOrders.thPhone")}</th>
                <th className="px-3 py-2">{t("adminOrders.thAddress")}</th>
                <th className="px-3 py-2">{t("adminOrders.thLast5")}</th>
                <th className="px-3 py-2">{t("adminOrders.thItems")}</th>
                <th className="px-3 py-2">{t("adminOrders.thTotal")}</th>
                <th className="px-3 py-2">{t("adminOrders.thStatus")}</th>
                <th className="px-3 py-2 text-right">{t("adminOrders.thActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-lulu-surface/40">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-white/80">
                    {new Date(o.created_at).toLocaleString(dateLocale)}
                  </td>
                  <td className="px-3 py-2">{o.customer_name}</td>
                  <td className="px-3 py-2 tabular-nums">{o.phone}</td>
                  <td className="max-w-[220px] px-3 py-2 text-xs text-white/85">
                    {formatDelivery(o)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{o.transfer_last5}</td>
                  <td className="max-w-[240px] px-3 py-2 text-xs text-white/85">
                    {formatItems(o.items)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{o.total}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className={o.paid ? "text-emerald-300" : "text-white/50"}>
                      {o.paid ? t("adminOrders.paid") : t("adminOrders.unpaid")}
                    </span>
                    {" · "}
                    <span className={o.picked_up ? "text-emerald-300" : "text-white/50"}>
                      {o.picked_up ? t("adminOrders.pickedUp") : t("adminOrders.notPickedUp")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={updating !== null}
                        onClick={() => void setPaid(o.id, !o.paid)}
                        className={
                          "rounded-full px-2 py-1 text-xs font-medium disabled:opacity-50 " +
                          (o.paid
                            ? "bg-lulu-accent/90 text-lulu-bg hover:bg-lulu-accent"
                            : "border border-lulu-accent text-lulu-accent hover:bg-lulu-accent/10")
                        }
                      >
                        {updating === o.id + "p"
                          ? t("adminOrders.loadingShort")
                          : o.paid
                            ? t("adminOrders.togglePaidOff")
                            : t("adminOrders.togglePaidOn")}
                      </button>
                      <button
                        type="button"
                        disabled={updating !== null}
                        onClick={() => void setPickedUp(o.id, !o.picked_up)}
                        className={
                          "rounded-full px-2 py-1 text-xs font-medium disabled:opacity-50 " +
                          (o.picked_up
                            ? "bg-lulu-accent/90 text-lulu-bg hover:bg-lulu-accent"
                            : "border border-lulu-accent text-lulu-accent hover:bg-lulu-accent/10")
                        }
                      >
                        {updating === o.id + "u"
                          ? t("adminOrders.loadingShort")
                          : o.picked_up
                            ? t("adminOrders.togglePickOff")
                            : t("adminOrders.togglePickOn")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
