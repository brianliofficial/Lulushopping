import { AdminAuthProvider } from "@/components/AdminAuthProvider";
import { AdminProductsEditor } from "@/components/AdminProductsEditor";

export const metadata = {
  title: "Products · LULU",
  description: "Edit the product catalog",
};

export default function AdminProductsPage() {
  return (
    <div className="min-h-full bg-lulu-bg">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <AdminAuthProvider>
          <AdminProductsEditor />
        </AdminAuthProvider>
      </main>
    </div>
  );
}
