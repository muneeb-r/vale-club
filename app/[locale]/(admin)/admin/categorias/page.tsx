import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { getTranslations } from "next-intl/server";
import CategoryManager from "@/components/admin/CategoryManager";

interface AdminCategoriasPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminCategoriasPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("categories") };
}

export default async function AdminCategoriasPage({
  params,
}: AdminCategoriasPageProps) {
  await params; // consume params
  const t = await getTranslations("admin");

  await connectDB();
  const rawCategories = await Category.find().sort({ order: 1, name: 1 }).lean();
  const categories = JSON.parse(JSON.stringify(rawCategories));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("categories")}
      </h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
