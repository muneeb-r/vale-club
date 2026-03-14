import { connectDB } from "@/lib/db";
import { ShopService } from "@/models/ShopService";
import { ShopCategory } from "@/models/ShopCategory";
import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { Phone, ArrowRight } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ShopOrderDrawer from "@/components/shop/ShopOrderDrawer";
import type { Metadata } from "next";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: t("meta_title"), description: t("meta_description") };
}

export const revalidate = 3600;

export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params;
  const t = await getTranslations("shop");

  await connectDB();
  const [rawCategories, rawServices] = await Promise.all([
    ShopCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
    ShopService.find({ isActive: true }).populate("category").sort({ order: 1 }).lean(),
  ]);

  // Get current user for pre-filling the order form
  const user = await getServerUser();

  const categories = JSON.parse(JSON.stringify(rawCategories)) as Array<{
    _id: string;
    slug: string;
    name: { es: string; en: string; ca: string };
    icon?: string;
    order: number;
  }>;

  const services = JSON.parse(JSON.stringify(rawServices)) as Array<{
    _id: string;
    category: { _id: string; slug: string; name: { es: string; en: string; ca: string } };
    name: { es: string; en: string; ca: string };
    description?: { es: string; en: string; ca: string };
    price?: number;
    promoPrice?: number;
    priceType: "fixed" | "quote";
  }>;

  function localeName(obj: { es: string; en: string; ca: string }) {
    if (locale === "en") return obj.en || obj.es;
    if (locale === "ca") return obj.ca || obj.es;
    return obj.es;
  }

  // Group services by category id — order follows categories array (already sorted by order)
  const servicesByCategory = services.reduce<Record<string, typeof services>>((acc, s) => {
    const catId = s.category._id;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="font-heading text-4xl font-bold text-foreground">Vale Shop</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("subtitle")}</p>
      </div>

      {/* Service categories — ordered dynamically from DB */}
      {categories.map((cat) => {
        const catServices = servicesByCategory[cat._id];
        if (!catServices?.length) return null;

        return (
          <section key={cat._id} className="space-y-4">
            <div className="flex items-center gap-2">
              {cat.icon && <CategoryIcon icon={cat.icon} size="md" className="text-primary" />}
              <h2 className="font-heading text-xl font-bold text-foreground">{localeName(cat.name)}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catServices.map((service) => (
                <div key={service._id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-heading font-semibold text-foreground">{localeName(service.name)}</h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{localeName(service.description)}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-end justify-between gap-2">
                    {service.priceType !== "quote" && (
                      <div>
                        {service.promoPrice && service.promoPrice !== service.price ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-foreground">{service.promoPrice} €</span>
                            <span className="text-sm text-muted-foreground line-through">{service.price} €</span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-foreground">{service.price} €</span>
                        )}
                      </div>
                    )}

                    <ShopOrderDrawer
                      service={service}
                      locale={locale}
                      initialEmail={user?.email ?? ""}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Custom solutions banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-heading font-semibold text-foreground flex items-center gap-2 justify-center sm:justify-start">
            <Phone className="w-4 h-4 text-primary" />
            {t("custom_title")}
          </p>
          <p className="text-sm text-muted-foreground">{t("custom_desc")}</p>
        </div>
        <Link
          href="/contacto"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          {t("custom_cta")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
