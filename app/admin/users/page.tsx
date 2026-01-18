import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const { user, error } = await requireAdmin();
  if (error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">用户管理</h1>
        <UsersTable />
      </div>
    </div>
  );
}
