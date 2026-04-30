import { NextResponse } from "next/server";
import { adminAccessErrorResponse, assertAdminAccess } from "@/lib/admin-auth";
import {
  getSaleWindow,
  setSaleWindow,
} from "@/lib/site-settings-supabase";
import { getSupabaseErrorText } from "@/lib/supabase/errors";

function parseOptionalIso(
  raw: unknown,
  field: string,
): { ok: true; date: Date | null } | { ok: false; response: NextResponse } {
  if (raw === null || raw === "") {
    return { ok: true, date: null };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${field} must be ISO string or null`, code: "INVALID_BODY" },
        { status: 400 },
      ),
    };
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Invalid ${field}`, code: "INVALID_DATE" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, date: d };
}

export async function GET() {
  try {
    await assertAdminAccess();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminAccessErrorResponse(msg);
    if (res) return res;
    throw e;
  }

  try {
    const w = await getSaleWindow();
    return NextResponse.json({
      countdownStartsAt: w.countdownStartsAt,
      countdownEndsAt: w.countdownEndsAt,
    });
  } catch (e) {
    const msg = getSupabaseErrorText(e);
    if (msg === "MISSING_SUPABASE" || msg.includes("MISSING_SUPABASE")) {
      return NextResponse.json(
        {
          error: msg,
          code: "MISSING_SUPABASE",
          countdownStartsAt: null,
          countdownEndsAt: null,
        },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      {
        error: msg || "Failed to load settings",
        countdownStartsAt: null,
        countdownEndsAt: null,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await assertAdminAccess();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const res = adminAccessErrorResponse(msg);
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

  if (
    typeof body !== "object" ||
    body === null ||
    !("countdownStartsAt" in body) ||
    !("countdownEndsAt" in body)
  ) {
    return NextResponse.json(
      {
        error: "Body must include countdownStartsAt and countdownEndsAt",
        code: "INVALID_BODY",
      },
      { status: 400 },
    );
  }

  const b = body as {
    countdownStartsAt: unknown;
    countdownEndsAt: unknown;
  };

  const startParsed = parseOptionalIso(b.countdownStartsAt, "countdownStartsAt");
  if (!startParsed.ok) return startParsed.response;
  const endParsed = parseOptionalIso(b.countdownEndsAt, "countdownEndsAt");
  if (!endParsed.ok) return endParsed.response;

  const startsAt = startParsed.date;
  const endsAt = endParsed.date;

  if (
    (startsAt === null && endsAt !== null) ||
    (startsAt !== null && endsAt === null)
  ) {
    return NextResponse.json(
      {
        error: "Set both start and end, or clear both",
        code: "INVALID_WINDOW",
      },
      { status: 400 },
    );
  }

  if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
    return NextResponse.json(
      { error: "Start must be before end", code: "INVALID_WINDOW" },
      { status: 400 },
    );
  }

  try {
    await setSaleWindow({ startsAt, endsAt });
    return NextResponse.json({
      countdownStartsAt: startsAt ? startsAt.toISOString() : null,
      countdownEndsAt: endsAt ? endsAt.toISOString() : null,
    });
  } catch (e) {
    const msg = getSupabaseErrorText(e);
    if (msg === "MISSING_SUPABASE" || msg.includes("MISSING_SUPABASE")) {
      return NextResponse.json(
        { error: msg, code: "MISSING_SUPABASE" },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: msg || "Failed to save settings", code: "SAVE_FAILED" },
      { status: 500 },
    );
  }
}
