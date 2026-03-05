import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  await connectDB();
  const business = await Business.findOne({ ownerId: user.userId }).select("name").lean();
  const businessName = business?.name as string | undefined;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <DashboardSidebar businessName={businessName} />
      <main className="flex-1 p-4 pt-15 md:pt-4 md:p-6 max-w-4xl min-w-0">
        {children}
      </main>
    </div>
  );
}
