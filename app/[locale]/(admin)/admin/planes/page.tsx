import { connectDB } from "@/lib/db";
import { Plan } from "@/models/Plan";
import { getTranslations } from "next-intl/server";
import PlanManager from "@/components/admin/PlanManager";
import BankDetailsEditor from "@/components/admin/BankDetailsEditor";

interface PlanesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PlanesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("plans") };
}

export default async function PlanesPage() {
  const t = await getTranslations("admin");

  await connectDB();
  const rawPlans = await Plan.find().sort({ price: 1 }).lean();
  const plans = JSON.parse(JSON.stringify(rawPlans));

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("plans")}
      </h1>
      <BankDetailsEditor />
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("plan_list")}</h2>
        <PlanManager plans={plans} />
      </div>
    </div>
  );
}
