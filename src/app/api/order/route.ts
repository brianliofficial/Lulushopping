import { NextResponse } from "next/server";
import { fetchFoodlistProducts } from "@/lib/foodlist-supabase";
import type { OrderLinePayload, OrderPayload } from "@/lib/types";
import { normalizeUkMobile, isValidUkMobile } from "@/lib/phone-uk";
import { isValidUkPostcodeFormat, normalizeUkPostcode } from "@/lib/postcode-uk";
import {
  getSoldQuantitiesForProducts,
  insertOrder,
  normalizeProductNameForMatch,
} from "@/lib/orders-supabase";

type Body = {
  customerName?: string;
  phone?: string;
  transferLast5?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  items?: Array<{
    name?: string;
    productId?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
};

function isValidLast5(s: string): boolean {
  return /^\d{5}$/.test(s.trim());
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const customerName = String(body.customerName ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  const transferLast5 = String(body.transferLast5 ?? "").trim();
  const addressLine1 = String(body.addressLine1 ?? "").trim();
  const addressLine2 = String(body.addressLine2 ?? "").trim();
  const city = String(body.city ?? "").trim();
  const postcodeRaw = String(body.postcode ?? "").trim();
  const rawItems = body.items;

  if (!customerName || customerName.length > 100) {
    return NextResponse.json(
      { error: "Name required", code: "EMPTY_NAME" },
      { status: 400 },
    );
  }
  if (!isValidUkMobile(phoneRaw)) {
    return NextResponse.json(
      { error: "Invalid UK mobile", code: "INVALID_PHONE" },
      { status: 400 },
    );
  }
  const phone = normalizeUkMobile(phoneRaw)!;
  if (!isValidLast5(transferLast5)) {
    return NextResponse.json(
      { error: "Invalid transfer digits", code: "INVALID_TRANSFER_LAST5" },
      { status: 400 },
    );
  }
  if (!addressLine1 || addressLine1.length > 200) {
    return NextResponse.json(
      { error: "Address required", code: "ADDRESS_REQUIRED" },
      { status: 400 },
    );
  }
  if (addressLine2.length > 200) {
    return NextResponse.json(
      { error: "Address line 2 too long", code: "INVALID_ADDRESS" },
      { status: 400 },
    );
  }
  if (!city || city.length > 100) {
    return NextResponse.json(
      { error: "City required", code: "CITY_REQUIRED" },
      { status: 400 },
    );
  }
  if (!postcodeRaw || !isValidUkPostcodeFormat(postcodeRaw)) {
    return NextResponse.json(
      { error: "Invalid postcode", code: "INVALID_POSTCODE" },
      { status: 400 },
    );
  }
  const postcode = normalizeUkPostcode(postcodeRaw);
  if (!isValidUkPostcodeFormat(postcode)) {
    return NextResponse.json(
      { error: "Invalid postcode", code: "INVALID_POSTCODE" },
      { status: 400 },
    );
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      { error: "Empty cart", code: "EMPTY_CART" },
      { status: 400 },
    );
  }

  const items: OrderLinePayload[] = [];
  let total = 0;
  for (const line of rawItems) {
    const name = String(line.name ?? "").trim();
    const productIdRaw = String(line.productId ?? "").trim();
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const lineTotal = Number(line.lineTotal);
    if (!name || !Number.isFinite(quantity) || quantity < 1) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;
    const lt =
      Number.isFinite(lineTotal) && lineTotal >= 0
        ? lineTotal
        : Math.round(quantity * unitPrice * 100) / 100;
    const row: OrderLinePayload = { name, quantity, unitPrice, lineTotal: lt };
    if (productIdRaw) row.productId = productIdRaw;
    items.push(row);
    total += lt;
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No valid items", code: "NO_VALID_ITEMS" },
      { status: 400 },
    );
  }

  total = Math.round(total * 100) / 100;

  let catalog: Awaited<ReturnType<typeof fetchFoodlistProducts>>;
  let sold: Record<string, number>;
  try {
    catalog = await fetchFoodlistProducts();
    sold = await getSoldQuantitiesForProducts(catalog);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPABASE") {
      return NextResponse.json(
        { error: "Supabase not configured", code: "MISSING_SUPABASE" },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "Stock check failed", code: "ORDER_FAILED" },
      { status: 500 },
    );
  }

  const nameToId = new Map<string, string>();
  for (const p of catalog) {
    const k = normalizeProductNameForMatch(p.name);
    if (!nameToId.has(k)) nameToId.set(k, p.id);
  }

  const need: Record<string, number> = {};
  for (const it of items) {
    const pid =
      it.productId && catalog.some((c) => c.id === it.productId)
        ? it.productId
        : (nameToId.get(normalizeProductNameForMatch(it.name)) ?? "");
    if (!pid) {
      return NextResponse.json(
        { error: "Unknown product", code: "UNKNOWN_PRODUCT" },
        { status: 400 },
      );
    }
    if (!it.productId || it.productId !== pid) it.productId = pid;
    need[pid] = (need[pid] ?? 0) + it.quantity;
  }

  for (const pid of Object.keys(need)) {
    const cap = catalog.find((p) => p.id === pid)?.maxQty ?? 0;
    const taken = sold[pid] ?? 0;
    if (taken + need[pid] > cap) {
      return NextResponse.json(
        { error: "Insufficient stock", code: "INSUFFICIENT_STOCK" },
        { status: 400 },
      );
    }
  }

  const order: OrderPayload = {
    customerName,
    phone,
    transferLast5,
    addressLine1,
    addressLine2,
    city,
    postcode,
    items,
    total,
    createdAt: new Date().toISOString(),
  };

  try {
    const id = await insertOrder(order);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "MISSING_SUPABASE") {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          code: "MISSING_SUPABASE",
        },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "Order failed", code: "ORDER_FAILED" },
      { status: 500 },
    );
  }
}
