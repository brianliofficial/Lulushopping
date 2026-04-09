import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSupabaseErrorText } from "@/lib/supabase/errors";

export type SaleWindowIso = {
  countdownStartsAt: string | null;
  countdownEndsAt: string | null;
};

function normalizeTs(v: unknown): string | null {
  if (v == null || v === "") return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function getSaleWindow(): Promise<SaleWindowIso> {
  const empty: SaleWindowIso = {
    countdownStartsAt: null,
    countdownEndsAt: null,
  };
  try {
    const sb = createServiceRoleClient();
    const { data, error } = await sb
      .from("site_settings")
      .select("countdown_starts_at, countdown_ends_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return empty;
    return {
      countdownStartsAt: normalizeTs(data.countdown_starts_at),
      countdownEndsAt: normalizeTs(data.countdown_ends_at),
    };
  } catch (e) {
    const msg = getSupabaseErrorText(e);
    if (msg === "MISSING_SUPABASE" || msg.includes("MISSING_SUPABASE")) {
      return empty;
    }
    console.error("getSaleWindow", e);
    return empty;
  }
}

export async function setSaleWindow(bounds: {
  startsAt: Date | null;
  endsAt: Date | null;
}): Promise<void> {
  const sb = createServiceRoleClient();
  const { error } = await sb.from("site_settings").upsert(
    {
      id: 1,
      countdown_starts_at: bounds.startsAt ? bounds.startsAt.toISOString() : null,
      countdown_ends_at: bounds.endsAt ? bounds.endsAt.toISOString() : null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}
