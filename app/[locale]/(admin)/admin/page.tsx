import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { Building2, Clock, Tag, ShoppingBag } from "lucide-react";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title") };
}

export default async function AdminPage() {
  const t = await getTranslations("admin");

  await connectDB();

  const [total, pending] = await Promise.all([
    Business.countDocuments({}),
    Business.countDocuments({ status: "inreview" }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("title")}
      </h1>

      {pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          {t("pending_count", { count: pending })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/empresas">
          <div className="bg-card rounded-2xl p-5 border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
            <Building2 className="w-6 h-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-foreground">
              {t("businesses")}
            </p>
            <p className="text-3xl font-bold text-primary mt-1">{total}</p>
            {pending > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                {pending} pendientes
              </p>
            )}
          </div>
        </Link>

        <Link href="/admin/categorias">
          <div className="bg-card rounded-2xl p-5 border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
            <Tag className="w-6 h-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-foreground">
              {t("categories")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Gestionar categorías
            </p>
          </div>
        </Link>

        <Link href="/admin/shop">
          <div className="bg-card rounded-2xl p-5 border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer">
            <ShoppingBag className="w-6 h-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-foreground">Vale Shop</p>
            <p className="text-sm text-muted-foreground mt-1">Gestionar servicios</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
