import { NextResponse } from "next/server";
import type { OrderLinePayload, OrderPayload } from "@/lib/types";
import { insertOrder } from "@/lib/orders-supabase";

type Body = {
  customerName?: string;
  phone?: string;
  transferLast5?: string;
  items?: Array<{
    name?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
};

function isValidPhone(s: string): boolean {
  const t = s.replace(/\s/g, "");
  return /^[\d+()-]{8,20}$/.test(t);
}

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
  const phone = String(body.phone ?? "").trim();
  const transferLast5 = String(body.transferLast5 ?? "").trim();
  const rawItems = body.items;

  if (!customerName || customerName.length > 100) {
    return NextResponse.json(
      { error: "Name required", code: "EMPTY_NAME" },
      { status: 400 },
    );
  }
  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Invalid phone", code: "INVALID_PHONE" },
      { status: 400 },
    );
  }
  if (!isValidLast5(transferLast5)) {
    return NextResponse.json(
      { error: "Invalid transfer digits", code: "INVALID_TRANSFER_LAST5" },
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
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const lineTotal = Number(line.lineTotal);
    if (!name || !Number.isFinite(quantity) || quantity < 1) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;
    const lt =
      Number.isFinite(lineTotal) && lineTotal >= 0
        ? lineTotal
        : Math.round(quantity * unitPrice * 100) / 100;
    items.push({ name, quantity, unitPrice, lineTotal: lt });
    total += lt;
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No valid items", code: "NO_VALID_ITEMS" },
      { status: 400 },
    );
  }

  total = Math.round(total * 100) / 100;

  const order: OrderPayload = {
    customerName,
    phone,
    transferLast5,
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
