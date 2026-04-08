import { NextResponse } from "next/server";
import { adminWriteErrorResponse, assertAdminWrite } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/orders-supabase";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertAdminWrite(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminWriteErrorResponse(msg);
    if (res) return res;
    throw e;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "缺少訂單 id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as { paid?: boolean; picked_up?: boolean };
  const paid = b.paid;
  const picked_up = b.picked_up;
  if (typeof paid !== "boolean" && typeof picked_up !== "boolean") {
    return NextResponse.json(
      { error: "請提供 paid 或 picked_up（boolean）" },
      { status: 400 },
    );
  }

  try {
    await updateOrderStatus(id, {
      ...(typeof paid === "boolean" ? { paid } : {}),
      ...(typeof picked_up === "boolean" ? { picked_up } : {}),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update order", code: "UPDATE_FAILED" },
      { status: 500 },
    );
  }
}
