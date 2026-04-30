import { auth } from "@/auth";
import { AdminSessionProvider } from "@/components/AdminSessionProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return <AdminSessionProvider session={session}>{children}</AdminSessionProvider>;
}
