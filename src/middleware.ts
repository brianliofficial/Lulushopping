import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }
  if (!req.auth) {
    const login = new URL("/admin/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }
  if (!isAdminEmail(req.auth.user?.email)) {
    return NextResponse.redirect(
      new URL("/admin/login?error=AccessDenied", req.nextUrl.origin),
    );
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
