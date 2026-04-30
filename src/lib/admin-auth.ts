import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-allowlist";

/** 管理 API：需已登入且 email 在 ADMIN_EMAIL_ALLOWLIST */
export async function assertAdminAccess(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }
  if (!isAdminEmail(session.user.email)) {
    throw new Error("FORBIDDEN");
  }
}

export function adminAccessErrorResponse(msg: string) {
  if (msg === "UNAUTHORIZED") {
    return Response.json(
      { error: "需要登入", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  if (msg === "FORBIDDEN") {
    return Response.json(
      { error: "未授權", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  return null;
}
