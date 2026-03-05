import { getTranslations } from "next-intl/server";
import AdminCreateBusinessForm from "@/components/admin/AdminCreateBusinessForm";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { User } from "@/models/User";

interface NuevaEmpresaPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NuevaEmpresaPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("new_business") };
}

export default async function NuevaEmpresaPage() {
  const t = await getTranslations("admin");

  await connectDB();
  const [rawCategories, rawUsers] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    User.find({ role: "business_owner" }).select("_id name email").lean(),
  ]);

  const categories = JSON.parse(JSON.stringify(rawCategories));
  const users = JSON.parse(JSON.stringify(rawUsers));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("new_business")}
      </h1>
      <AdminCreateBusinessForm
        categories={categories}
        users={users}
      />
    </div>
  );
}
