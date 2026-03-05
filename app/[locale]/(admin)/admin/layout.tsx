import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
    </div>
  );
}
