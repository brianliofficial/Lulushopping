/** Normalise UK postcode: trim, uppercase, single space before inward code */
export function normalizeUkPostcode(input: string): string {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  if (s.length < 5) return s;
  const outward = s.slice(0, -3);
  const inward = s.slice(-3);
  return `${outward} ${inward}`;
}

/**
 * Loose UK postcode check (full outward + inward). Does not validate against PAF.
 */
export function isValidUkPostcodeFormat(input: string): boolean {
  const compact = input.trim().toUpperCase().replace(/\s/g, "");
  if (compact.length < 5 || compact.length > 8) return false;
  return /^[A-Z]{1,2}\d[A-Z\d]{0,2}\d[A-Z]{2}$/.test(compact);
}
