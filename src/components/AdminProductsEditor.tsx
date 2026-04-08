"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { useAdminSecret } from "@/components/AdminAuthProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n-context";

function emptyProduct(): Product {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    name: "",
    description: "",
    price: 0,
    maxQty: 0,
    imageUrl: "",
  };
}

function resolveProductApiError(
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
  return t("errors.admin.SAVE_FAILED");
}

function SortableRow({
  product,
  onChange,
  onRemove,
  editing,
  onToggleEdit,
}: {
  product: Product;
  onChange: (id: string, patch: Partial<Product>) => void;
  onRemove: (id: string) => void;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-white/15 bg-lulu-surface/80 p-3 shadow-sm ${
        isDragging ? "z-10 opacity-90 ring-2 ring-lulu-accent" : ""
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none rounded p-1 text-white/60 hover:bg-white/10 active:cursor-grabbing"
          aria-label={t("adminProducts.dragLabel")}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="text-lg leading-none">
            ⋮⋮
          </span>
        </button>
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.rowName")}</label>
            {editing ? (
              <input
                type="text"
                value={product.name}
                onChange={(e) => onChange(product.id, { name: e.target.value })}
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
                placeholder={t("adminProducts.placeholderName")}
              />
            ) : (
              <p className="rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-sm text-white/90">
                {product.name || "—"}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.rowPrice")}</label>
            {editing ? (
              <input
                type="number"
                min={0}
                step={1}
                value={product.price || ""}
                onChange={(e) =>
                  onChange(product.id, {
                    price: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white tabular-nums"
              />
            ) : (
              <p className="rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-sm tabular-nums text-white/90">
                {product.price}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.rowMax")}</label>
            {editing ? (
              <input
                type="number"
                min={0}
                step={1}
                value={product.maxQty || ""}
                onChange={(e) =>
                  onChange(product.id, {
                    maxQty: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  })
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white tabular-nums"
              />
            ) : (
              <p className="rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-sm tabular-nums text-white/90">
                {product.maxQty}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.rowImage")}</label>
            {editing ? (
              <input
                type="url"
                value={product.imageUrl ?? ""}
                onChange={(e) =>
                  onChange(product.id, { imageUrl: e.target.value })
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
                placeholder="https://…"
              />
            ) : (
              <p className="truncate rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-xs text-white/75">
                {(product.imageUrl ?? "").trim() || "—"}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-full border border-white/30 px-2 py-1 text-xs text-white hover:bg-white/10"
          >
            {editing ? t("adminProducts.done") : t("adminProducts.edit")}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              className="rounded px-2 py-1 text-xs text-red-300 hover:underline"
            >
              {t("adminProducts.delete")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="pl-9">
        <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.rowDetail")}</label>
        {editing ? (
          <textarea
            value={product.description}
            onChange={(e) => onChange(product.id, { description: e.target.value })}
            rows={2}
            className="w-full resize-y rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
            placeholder={t("adminProducts.placeholderDetail")}
          />
        ) : (
          <p className="min-h-[2.75rem] whitespace-pre-wrap rounded-lg border border-transparent bg-white/5 px-2 py-1.5 text-sm text-white/80">
            {product.description?.trim() ? product.description : "—"}
          </p>
        )}
      </div>
    </li>
  );
}

export function AdminProductsEditor() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;
  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const { adminSecret, setAdminSecret } = useAdminSecret();
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setSaveErr(null);
    try {
      const res = await fetch("/api/products");
      const data = (await res.json().catch(() => ({}))) as {
        products?: Product[];
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setSaveErr(resolveProductApiError(data.code, data.error, t));
        setProducts([]);
        return;
      }
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setSaveErr(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProducts((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function removeProduct(id: string) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleRowEdit(id: string) {
    const wasEditing = editingIds.has(id);
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (wasEditing) next.delete(id);
      else next.add(id);
      return next;
    });
    if (wasEditing) {
      void persistList(productsRef.current);
    }
  }

  function startAddProduct() {
    setSaveErr(null);
    setDraft(emptyProduct());
  }

  async function persistList(list: Product[]) {
    setSaveMsg(null);
    setSaveErr(null);
    setSaving(true);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (adminSecret.trim()) {
      headers.Authorization = `Bearer ${adminSecret.trim()}`;
    }
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers,
        body: JSON.stringify({ products: list }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        products?: Product[];
      };
      if (!res.ok) {
        setSaveErr(resolveProductApiError(data.code, data.error, t));
        return;
      }
      if (data.products) {
        setProducts(data.products);
      }
      setSaveMsg(t("adminProducts.saveOk"));
    } catch {
      setSaveErr(t("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmAddDraft() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setSaveErr(t("adminProducts.nameRequired"));
      return;
    }
    const row: Product = {
      ...draft,
      name,
      description: draft.description.trim(),
      price: Math.max(0, Number(draft.price) || 0),
      maxQty: Math.max(0, Math.floor(Number(draft.maxQty) || 0)),
      imageUrl: (draft.imageUrl ?? "").trim(),
    };
    const next = [...products, row];
    await persistList(next);
    setDraft(null);
  }

  function cancelDraft() {
    setDraft(null);
    setSaveErr(null);
  }

  async function saveCurrentList() {
    await persistList(products);
  }

  if (loading) {
    return <p className="text-white/80">{t("productList.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          {t("adminProducts.pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-white/75">{t("adminProducts.pageSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-lulu-surface/50 p-4 text-sm text-white/85">
        <p dangerouslySetInnerHTML={{ __html: t("adminProducts.introP1") }} />
        <p
          className="mt-2 text-white/65"
          dangerouslySetInnerHTML={{ __html: t("adminProducts.introP2") }}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={startAddProduct}
          disabled={draft !== null}
          className="rounded-full bg-lulu-accent px-4 py-2 text-sm font-semibold text-lulu-bg hover:bg-lulu-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("adminProducts.addProduct")}
        </button>
        <div className="min-w-[180px] flex-1">
          <label htmlFor="admin-secret" className="mb-0.5 block text-xs text-white/60">
            {t("adminProducts.adminPassword")}
          </label>
          <input
            id="admin-secret"
            type="password"
            autoComplete="off"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
            placeholder={t("adminProducts.passwordPh")}
          />
        </div>
        <button
          type="button"
          disabled={saving || draft !== null}
          onClick={() => void saveCurrentList()}
          className="rounded-full border border-lulu-accent px-4 py-2 text-sm font-medium text-lulu-accent hover:bg-lulu-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("adminProducts.saving") : t("adminProducts.saveList")}
        </button>
        <Link
          href="/admin/orders"
          className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          {t("adminProducts.ordersLink")}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          {t("adminProducts.homeLink")}
        </Link>
      </div>

      {draft ? (
        <div className="rounded-xl border-2 border-lulu-accent/50 bg-lulu-bg/40 p-4">
          <h3 className="mb-3 font-display text-lg font-semibold text-white">
            {t("adminProducts.draftTitle")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.nameReq")}</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
                placeholder={t("adminProducts.placeholderName")}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.price")}</label>
              <input
                type="number"
                min={0}
                value={draft.price || ""}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          price: Math.max(0, Number(e.target.value) || 0),
                        }
                      : d,
                  )
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.maxQty")}</label>
              <input
                type="number"
                min={0}
                value={draft.maxQty || ""}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          maxQty: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        }
                      : d,
                  )
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.imageUrl")}</label>
              <input
                type="url"
                value={draft.imageUrl ?? ""}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, imageUrl: e.target.value } : d))
                }
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
                placeholder="https://…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-0.5 block text-xs text-white/70">{t("adminProducts.detail")}</label>
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                }
                rows={2}
                className="w-full rounded-lg border border-white/20 bg-lulu-bg px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void confirmAddDraft()}
              className="rounded-full bg-lulu-accent px-5 py-2 text-sm font-semibold text-lulu-bg hover:bg-lulu-accent-muted disabled:opacity-50"
            >
              {saving ? t("adminProducts.saving") : t("adminProducts.confirmAdd")}
            </button>
            <button
              type="button"
              onClick={cancelDraft}
              className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              {t("adminProducts.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {saveMsg ? (
        <p className="text-sm text-emerald-200" role="status">
          {saveMsg}
        </p>
      ) : null}
      {saveErr ? (
        <p className="text-sm text-red-300" role="alert">
          {saveErr}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={products.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-3">
            {products.map((p) => (
              <SortableRow
                key={p.id}
                product={p}
                onChange={updateProduct}
                onRemove={removeProduct}
                editing={editingIds.has(p.id)}
                onToggleEdit={() => toggleRowEdit(p.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {products.length === 0 && !draft ? (
        <p className="text-center text-white/60">{t("adminProducts.emptyHint")}</p>
      ) : null}
    </div>
  );
}
