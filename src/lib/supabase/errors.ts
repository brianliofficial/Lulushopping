/** PostgREST / Supabase 回傳的錯誤物件不一定是 Error 實例 */
export function getSupabaseErrorText(err: unknown): string {
  if (!err) return "未知錯誤";
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null) {
    const o = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [o.message, o.details, o.hint].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    if (parts.length > 0) return parts.join(" — ");
    if (o.code) return `code: ${o.code}`;
  }
  return String(err);
}

export function getSupabaseErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const c = (err as { code?: string }).code;
    if (typeof c === "string") return c;
  }
  return "";
}
