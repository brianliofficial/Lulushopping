/**
 * Sale window: both ISO bounds must be set to enforce restrictions.
 * If either is null/empty, shopping is always allowed (no window configured).
 */
export type SalePhase = "unrestricted" | "before" | "during" | "after";

export function getSalePhase(
  startsAtIso: string | null,
  endsAtIso: string | null,
  nowMs: number = Date.now(),
): SalePhase {
  if (!startsAtIso?.trim() || !endsAtIso?.trim()) return "unrestricted";
  const start = new Date(startsAtIso).getTime();
  const end = new Date(endsAtIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    return "unrestricted";
  }
  if (nowMs < start) return "before";
  if (nowMs > end) return "after";
  return "during";
}

export function isShoppingAllowed(
  startsAtIso: string | null,
  endsAtIso: string | null,
  nowMs: number = Date.now(),
): boolean {
  const phase = getSalePhase(startsAtIso, endsAtIso, nowMs);
  return phase === "unrestricted" || phase === "during";
}

/**
 * For sale-limited products: "unrestricted" (no window configured) is treated like
 * "after" — not purchasable except during an active `during` phase.
 */
export function effectiveLimitedSalePhase(
  phase: SalePhase,
): "before" | "during" | "after" {
  if (phase === "before") return "before";
  if (phase === "during") return "during";
  return "after";
}
