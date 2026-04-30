/** 逗號分隔，與登入 email 小寫比對（Gmail 等） */
export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAdminEmailAllowlist();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}
