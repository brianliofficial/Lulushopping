import { AdminOrdersPanel } from "@/components/AdminOrdersPanel";

export const metadata = {
  title: "Orders · LULU",
  description: "View orders and update paid / picked-up status",
};

export default function AdminOrdersPage() {
  return (
    <div className="min-h-full bg-lulu-bg">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <AdminOrdersPanel />
      </main>
    </div>
  );
}
