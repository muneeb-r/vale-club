import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DashboardCreateBusinessForm from "@/components/forms/DashboardCreateBusinessForm";

interface CrearPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CrearPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("create_business_title") };
}

export default async function CrearPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  await connectDB();

  // If already has a business, go to profile
  const existing = await Business.findOne({ ownerId: user.userId }).lean();
  if (existing) redirect("/dashboard/perfil");

  return <DashboardCreateBusinessForm />;
}
