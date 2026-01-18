import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { EventsTable } from "./events-table";

export default async function EventsPage() {
  const { error } = await requireAdmin();
  if (error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">事件列表</h1>
        <EventsTable />
      </div>
    </div>
  );
}
