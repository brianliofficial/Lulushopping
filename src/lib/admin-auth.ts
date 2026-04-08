/** 後台寫入／訂單管理 API：正式環境需 Authorization: Bearer（值同 PRODUCTS_ADMIN_SECRET） */
export function assertAdminWrite(request: Request): void {
  if (process.env.NODE_ENV === "development") return;
  const secret = process.env.PRODUCTS_ADMIN_SECRET;
  if (!secret) {
    throw new Error("NO_ADMIN_SECRET");
  }
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    throw new Error("FORBIDDEN");
  }
}

export function adminWriteErrorResponse(msg: string) {
  if (msg === "NO_ADMIN_SECRET") {
    return Response.json(
      {
        error:
          "正式環境請設定 PRODUCTS_ADMIN_SECRET，並在管理頁輸入相同密碼。",
        code: "NO_ADMIN_SECRET",
      },
      { status: 503 },
    );
  }
  if (msg === "FORBIDDEN") {
    return Response.json(
      { error: "未授權", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  return null;
}
