import { NextResponse } from "next/server";
import { adminWriteErrorResponse, assertAdminWrite } from "@/lib/admin-auth";
import {
  fetchFoodlistProducts,
  replaceFoodlist,
  validateProductsPayload,
} from "@/lib/foodlist-supabase";
import {
  getSupabaseErrorCode,
  getSupabaseErrorText,
} from "@/lib/supabase/errors";

export async function GET() {
  try {
    const products = await fetchFoodlistProducts();
    return NextResponse.json({ products });
  } catch (e) {
    const msg = getSupabaseErrorText(e);
    if (msg === "MISSING_SUPABASE" || msg.includes("MISSING_SUPABASE")) {
      return NextResponse.json(
        {
          error:
            "請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY（Vercel：Project → Settings → Environment Variables；本機：.env.local）。",
          code: "MISSING_SUPABASE",
          products: [],
        },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      {
        error: msg || "無法讀取商品資料",
        code: "FETCH_FAILED",
        products: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    assertAdminWrite(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminWriteErrorResponse(msg);
    if (res) return res;
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  let products;
  try {
    products = validateProductsPayload(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid product body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  if (products.length === 0) {
    return NextResponse.json(
      {
        error: "No valid products",
        code: "EMPTY_PRODUCTS",
      },
      { status: 400 },
    );
  }

  try {
    await replaceFoodlist(products);
    const fresh = await fetchFoodlistProducts();
    return NextResponse.json({ ok: true, products: fresh });
  } catch (e) {
    const msg = getSupabaseErrorText(e);
    const code =
      getSupabaseErrorCode(e) ||
      (e instanceof Error && "code" in e
        ? String((e as Error & { code?: string }).code)
        : "");

    if (msg.includes("MISSING_SUPABASE")) {
      return NextResponse.json(
        { error: "Supabase not configured", code: "MISSING_SUPABASE" },
        { status: 503 },
      );
    }

    console.error(e);

    let clientMsg = msg || "Save failed";
    if (code === "PGRST204") {
      clientMsg +=
        " (PostgREST: reload schema cache — run supabase/migrations/003_postgrest_reload_schema.sql)";
    }

    return NextResponse.json(
      { error: clientMsg, code: code || "SAVE_FAILED" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
