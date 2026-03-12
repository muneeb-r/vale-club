import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Category } from "@/models/Category";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BusinessProfileForm from "@/components/forms/BusinessProfileForm";

interface ContactoPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactoPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("contact") };
}

export default async function ContactoPage({ params }: ContactoPageProps) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const t = await getTranslations("dashboard");

  await connectDB();
  const [rawBusiness, rawCategories] = await Promise.all([
    Business.findOne({ ownerId: user.userId })
      .populate("categories", "name nameEn nameCa icon _id")
      .lean(),
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
  ]);

  if (!rawBusiness) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("contact")}
        </h1>
        <p className="text-muted-foreground">{t("no_business")}</p>
      </div>
    );
  }

  const business = JSON.parse(JSON.stringify(rawBusiness));
  const allCategories = JSON.parse(JSON.stringify(rawCategories));
  const categories = {
    parents: allCategories.filter((c: { parentCategory?: string }) => !c.parentCategory),
    subcategories: allCategories.filter((c: { parentCategory?: string }) => !!c.parentCategory),
  };

  if (business.status === "inreview") {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("contact")}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-yellow-800">{t("editing_locked")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("contact")}
      </h1>
      <BusinessProfileForm
        business={business}
        categories={categories}
        locale={locale}
        defaultTab="contact"
      />
    </div>
  );
}
