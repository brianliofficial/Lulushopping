/**
 * UK mobile: national 07 + 9 digits (11 digits), or +44 7… / 0044 7…
 */
export function normalizeUkMobile(input: string): string | null {
  let s = input.trim().replace(/[\s-]/g, "");
  if (!s) return null;
  if (s.startsWith("+44")) {
    s = `0${s.slice(3)}`;
  } else if (s.startsWith("0044")) {
    s = `0${s.slice(4)}`;
  }
  if (/^7\d{9}$/.test(s)) {
    s = `0${s}`;
  }
  if (!/^07\d{9}$/.test(s)) return null;
  return s;
}

export function isValidUkMobile(input: string): boolean {
  return normalizeUkMobile(input) !== null;
}
