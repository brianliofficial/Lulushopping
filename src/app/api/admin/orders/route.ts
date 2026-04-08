import { NextResponse } from "next/server";
import { adminWriteErrorResponse, assertAdminWrite } from "@/lib/admin-auth";
import { deleteAllOrders, fetchOrdersList } from "@/lib/orders-supabase";

export async function GET(request: Request) {
  try {
    assertAdminWrite(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminWriteErrorResponse(msg);
    if (res) return res;
    throw e;
  }

  try {
    const orders = await fetchOrdersList();
    return NextResponse.json({ orders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPABASE") {
      return NextResponse.json(
        { error: "Supabase 未設定", code: "MISSING_SUPABASE", orders: [] },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load orders", code: "ORDERS_LOAD_FAILED", orders: [] },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    assertAdminWrite(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminWriteErrorResponse(msg);
    if (res) return res;
    throw e;
  }

  try {
    await deleteAllOrders();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPABASE") {
      return NextResponse.json(
        { error: "Supabase 未設定", code: "MISSING_SUPABASE" },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete orders", code: "DELETE_FAILED" },
      { status: 500 },
    );
  }
}
