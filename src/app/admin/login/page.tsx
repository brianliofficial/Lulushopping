import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { AdminLoginForm } from "./AdminLoginForm";

function LoginLoading() {
  return <p className="text-sm text-white/60">…</p>;
}

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.email && isAdminEmail(session.user.email)) {
    redirect("/admin/products");
  }
  return (
    <div className="min-h-full bg-lulu-bg px-4 py-10">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<LoginLoading />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
