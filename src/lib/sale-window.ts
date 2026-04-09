/**
 * Sale window: both ISO bounds must be set to enforce restrictions.
 * If either is null/empty, shopping is always allowed (no window configured).
 */
export function isShoppingAllowed(
  startsAtIso: string | null,
  endsAtIso: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!startsAtIso?.trim() || !endsAtIso?.trim()) return true;
  const start = new Date(startsAtIso).getTime();
  const end = new Date(endsAtIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return true;
  return nowMs >= start && nowMs <= end;
}
