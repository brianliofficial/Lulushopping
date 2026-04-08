import { randomUUID } from "crypto";
import { getSupabaseErrorText } from "@/lib/supabase/errors";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

/** 已寫入 DB 的 foodlist.id（bigint）在客端用十進位字串表示 */
export function isPersistedFoodlistId(id: string): boolean {
  const s = id.trim();
  if (!/^\d+$/.test(s)) return false;
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0;
}

const DESC_SEP = "\n\n";

/** 與 public.foodlist 實際欄位對齊（無 name 欄位時：標題與說明打包在 description） */
function packDescription(p: Product): string {
  const title = p.name.trim();
  const body = (p.description ?? "").trim();
  if (!body) return title;
  return `${title}${DESC_SEP}${body}`;
}

function unpackDescription(stored: string): { name: string; description: string } {
  const s = stored.trim();
  if (s.includes(DESC_SEP)) {
    const i = s.indexOf(DESC_SEP);
    return {
      name: s.slice(0, i).trim() || "商品",
      description: s.slice(i + DESC_SEP.length).trim(),
    };
  }
  const lines = s.split("\n");
  return {
    name: (lines[0] ?? "").trim() || "商品",
    description: lines.slice(1).join("\n").trim(),
  };
}

type FoodlistRow = {
  id: number | string;
  description: string | null;
  price: string | number | null;
  max_qty: number | null;
  product_pic?: string | null;
};

function rowToProduct(row: FoodlistRow): Product {
  const stored = String(row.description ?? "");
  const { name, description } = unpackDescription(stored);
  const pic = row.product_pic;
  return {
    id: String(row.id),
    name,
    description,
    price: Number(row.price ?? 0),
    maxQty: Math.max(0, Math.floor(Number(row.max_qty ?? 0))),
    imageUrl: typeof pic === "string" && pic.trim() ? pic.trim() : undefined,
  };
}

function throwDb(err: unknown): never {
  const text = getSupabaseErrorText(err);
  const e = new Error(text);
  if (err && typeof err === "object" && "code" in err) {
    (e as Error & { code?: string }).code = String(
      (err as { code?: string }).code ?? "",
    );
  }
  throw e;
}

function rowPayload(p: Product, sortOrder: number) {
  const price = Number.isFinite(p.price) && p.price >= 0 ? p.price : 0;
  const maxQty = Number.isFinite(p.maxQty) && p.maxQty >= 0 ? Math.floor(p.maxQty) : 0;
  const pic = (p.imageUrl ?? "").trim();
  return {
    description: packDescription(p),
    price,
    max_qty: maxQty,
    product_price: Math.round(price),
    product_limit: maxQty,
    sort_order: sortOrder,
    product_pic: pic || null,
  };
}

export async function fetchFoodlistProducts(): Promise<Product[]> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("foodlist")
    .select("id,description,price,max_qty,sort_order,product_pic")
    .order("sort_order", { ascending: true });
  if (error) throwDb(error);
  return (data ?? []).map((r) => rowToProduct(r as FoodlistRow));
}

export async function replaceFoodlist(products: Product[]): Promise<void> {
  const sb = createServiceRoleClient();

  const { data: existing, error: selErr } = await sb.from("foodlist").select("id");
  if (selErr) throwDb(selErr);

  const existingIds = new Set(
    (existing ?? []).map((r: { id: number | string }) => String(r.id)),
  );

  const keepIds = new Set(products.map((p) => p.id).filter(isPersistedFoodlistId));

  const toRemove = [...existingIds].filter((id) => !keepIds.has(id));
  if (toRemove.length > 0) {
    const { error: delErr } = await sb
      .from("foodlist")
      .delete()
      .in("id", toRemove.map((id) => Number(id)));
    if (delErr) throwDb(delErr);
  }

  const updates = products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => isPersistedFoodlistId(p.id));
  const inserts = products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !isPersistedFoodlistId(p.id));

  const upResults = await Promise.all(
    updates.map(({ p, i }) =>
      sb.from("foodlist").update(rowPayload(p, i)).eq("id", Number(p.id)),
    ),
  );
  for (const r of upResults) {
    if (r.error) throwDb(r.error);
  }

  if (inserts.length > 0) {
    const rows = inserts.map(({ p, i }) => rowPayload(p, i));
    const { error: insErr } = await sb.from("foodlist").insert(rows);
    if (insErr) throwDb(insErr);
  }
}

export function validateProductsPayload(body: unknown): Product[] {
  if (!body || typeof body !== "object") throw new Error("INVALID_BODY");
  const products = (body as { products?: unknown }).products;
  if (!Array.isArray(products)) throw new Error("INVALID_BODY");
  const out: Product[] = [];
  for (const row of products) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    const name = String(r.name ?? "").trim();
    if (!name) continue;
    const price = Number(r.price);
    const maxQty = Math.floor(Number(r.maxQty));
    const imageUrl = String(r.imageUrl ?? r.image_url ?? "").trim();
    out.push({
      id: id || randomUUID(),
      name,
      description: String(r.description ?? "").trim(),
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      maxQty: Number.isFinite(maxQty) && maxQty >= 0 ? maxQty : 0,
      imageUrl,
    });
  }
  return out;
}
