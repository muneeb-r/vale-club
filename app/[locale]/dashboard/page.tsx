import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ExternalLink, Pencil, Phone, Star, CreditCard, XCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const t = await getTranslations("dashboard");

  await connectDB();
  const rawBusiness = await Business.findOne({ ownerId: user.userId })
    .populate("categories", "name nameEn icon")
    .lean();

  const business = rawBusiness ? JSON.parse(JSON.stringify(rawBusiness)) : null;

  // Plan expiry helpers
  const now = new Date();
  const featuredUntil = business?.featuredUntil ? new Date(business.featuredUntil) : null;
  const isPlanExpired = business?.plan === "paid" && featuredUntil !== null && featuredUntil < now;
  const daysUntilExpiry = featuredUntil
    ? Math.ceil((featuredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon =
    business?.plan === "paid" &&
    daysUntilExpiry !== null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry <= 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("overview")}, {user.email}</p>
      </div>

      {!business ? (
        <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-4">
          <p className="text-muted-foreground">{t("no_business")}</p>
          <Link href="/dashboard/crear">
            <Button className="rounded-full bg-primary text-primary-foreground">
              {t("create_business")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status banner */}
          <div
            className={`rounded-2xl p-4 border flex items-start gap-3 ${
              business.status === "active"
                ? "bg-green-50 border-green-200"
                : business.status === "rejected"
                ? "bg-red-50 border-red-200"
                : business.status === "blocked"
                ? "bg-orange-50 border-orange-200"
                : business.status === "inreview"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-muted border-border"
            }`}
          >
            {business.status === "active" ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            ) : business.status === "rejected" ? (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            ) : business.status === "blocked" ? (
              <XCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            ) : (
              <Clock
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  business.status === "inreview" ? "text-yellow-600" : "text-muted-foreground"
                }`}
              />
            )}
            <div className="space-y-2">
              <p
                className={`text-sm ${
                  business.status === "active"
                    ? "text-green-800"
                    : business.status === "rejected"
                    ? "text-red-800"
                    : business.status === "blocked"
                    ? "text-orange-800"
                    : business.status === "inreview"
                    ? "text-yellow-800"
                    : "text-muted-foreground"
                }`}
              >
                {business.status === "active"
                  ? t("profile_approved")
                  : business.status === "rejected"
                  ? t("profile_rejected")
                  : business.status === "blocked"
                  ? t("profile_blocked")
                  : business.status === "inreview"
                  ? t("pending_approval")
                  : t("profile_pending")}
              </p>
              {business.status === "rejected" && (
                <Link href="/dashboard/perfil">
                  <Button size="sm" className="rounded-full bg-primary text-primary-foreground h-7 px-3 text-xs">
                    {t("fix_and_resubmit")}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Plan expiry warnings */}
          {isPlanExpired && (
            <div className="rounded-2xl p-4 border bg-red-50 border-red-200 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{t("plan_expired_warning")}</p>
            </div>
          )}
          {isExpiringSoon && !isPlanExpired && (
            <div className="rounded-2xl p-4 border bg-amber-50 border-amber-200 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{t("plan_renewal_warning")}</p>
            </div>
          )}

          {/* Business overview card */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <h2 className="font-heading font-semibold text-foreground">
                {business.name}
              </h2>
              {business.status === "active" && (
                <Link
                  href={("/empresa/" + business.slug) as `/empresa/${string}`}
                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                >
                  Ver perfil <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Rating</p>
                <p className="font-medium">
                  {business.reviewCount > 0
                    ? <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{business.rating.toFixed(1)} ({business.reviewCount})</span>
                    : t("no_reviews_yet")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">{t("plan_section")}</p>
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium">
                    {business.plan === "paid" ? t("plan_pro") : t("plan_free")}
                  </p>
                  {business.plan === "paid" && featuredUntil && (
                    <p
                      className={`text-xs ${
                        isPlanExpired ? "text-red-600 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {isPlanExpired ? t("plan_expired") : t("plan_expires")}{" "}
                      {featuredUntil.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick nav cards — visible regardless of status so owner can always edit */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/perfil">
              <div className="bg-card rounded-2xl p-4 border border-border hover:border-primary transition-colors cursor-pointer flex items-center gap-3">
                <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">{t("profile")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("edit_info")}</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/contacto">
              <div className="bg-card rounded-2xl p-4 border border-border hover:border-primary transition-colors cursor-pointer flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">{t("contact")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("whatsapp_email_web")}</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/resenas">
              <div className="bg-card rounded-2xl p-4 border border-border hover:border-primary transition-colors cursor-pointer flex items-center gap-3">
                <Star className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">{t("reviews")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {business.reviewCount > 0
                      ? `${business.reviewCount} reseñas`
                      : t("no_reviews_yet")}
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/plan">
              <div
                className={`bg-card rounded-2xl p-4 border transition-colors cursor-pointer flex items-center gap-3 ${
                  isPlanExpired || isExpiringSoon
                    ? "border-amber-300 hover:border-amber-400"
                    : "border-border hover:border-primary"
                }`}
              >
                <CreditCard
                  className={`w-4 h-4 shrink-0 ${
                    isPlanExpired
                      ? "text-red-500"
                      : isExpiringSoon
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{t("plan_section")}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isPlanExpired
                        ? "text-red-600"
                        : isExpiringSoon
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {business.plan === "paid" ? t("plan_pro") : t("plan_upgrade_title")}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
