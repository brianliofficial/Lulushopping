import { createServiceRoleClient } from "@/lib/supabase/server";
import type { OrderLinePayload, OrderPayload } from "@/lib/types";

/** 與 public.orders.items（jsonb）對齊：客戶資料與品項列在同一欄 */
export type OrderItemsV1 = {
  v: 1;
  customerName: string;
  phone: string;
  transferLast5: string;
  lines: OrderLinePayload[];
};

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  transfer_last5: string;
  items: OrderLinePayload[];
  total: number;
  paid: boolean;
  picked_up: boolean;
  created_at: string;
};

function parseStoredOrderItems(raw: unknown): {
  lines: OrderLinePayload[];
  customerName: string;
  phone: string;
  transferLast5: string;
} {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.v === 1 && Array.isArray(o.lines)) {
      return {
        lines: o.lines as OrderLinePayload[],
        customerName: String(o.customerName ?? "").trim(),
        phone: String(o.phone ?? "").trim(),
        transferLast5: String(o.transferLast5 ?? "").trim(),
      };
    }
  }
  if (Array.isArray(raw)) {
    return {
      lines: raw as OrderLinePayload[],
      customerName: "",
      phone: "",
      transferLast5: "",
    };
  }
  return {
    lines: [],
    customerName: "",
    phone: "",
    transferLast5: "",
  };
}

function orderIdForQuery(id: string): number | string {
  const s = id.trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n)) return n;
  }
  return id;
}

export async function insertOrder(order: OrderPayload): Promise<string> {
  const sb = createServiceRoleClient();
  const payload: OrderItemsV1 = {
    v: 1,
    customerName: order.customerName,
    phone: order.phone,
    transferLast5: order.transferLast5,
    lines: order.items,
  };
  const { data, error } = await sb
    .from("orders")
    .insert({
      items: payload,
      total: order.total,
      paid: false,
      picked_up: false,
    })
    .select("id")
    .single();
  if (error) throw error;
  return String(data.id);
}

export async function fetchOrdersList(): Promise<OrderRow[]> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("orders")
    .select("id,items,total,paid,picked_up,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as {
      id: number | string;
      items: unknown;
      total: number | string;
      paid: boolean;
      picked_up: boolean;
      created_at: string;
    };
    const parsed = parseStoredOrderItems(r.items);
    return {
      id: String(r.id),
      customer_name: parsed.customerName,
      phone: parsed.phone,
      transfer_last5: parsed.transferLast5,
      items: parsed.lines,
      total: Number(r.total),
      paid: r.paid,
      picked_up: r.picked_up,
      created_at: r.created_at,
    };
  });
}

export async function updateOrderStatus(
  id: string,
  patch: { paid?: boolean; picked_up?: boolean },
): Promise<void> {
  const sb = createServiceRoleClient();
  const update: Record<string, boolean> = {};
  if (typeof patch.paid === "boolean") update.paid = patch.paid;
  if (typeof patch.picked_up === "boolean") update.picked_up = patch.picked_up;
  if (Object.keys(update).length === 0) return;
  const { error } = await sb
    .from("orders")
    .update(update)
    .eq("id", orderIdForQuery(id));
  if (error) throw error;
}

/** 刪除 orders 全部列（依 created_at 篩選以符合 PostgREST 需有條件之限制） */
export async function deleteAllOrders(): Promise<void> {
  const sb = createServiceRoleClient();
  const { error } = await sb
    .from("orders")
    .delete()
    .gte("created_at", "1970-01-01T00:00:00+00:00");
  if (error) throw error;
}
