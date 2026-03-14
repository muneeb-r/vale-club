import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Plan } from "@/models/Plan";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { Subscription } from "@/models/Subscription";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CreditCard, Zap, History, CheckCircle2, AlertTriangle } from "lucide-react";
import SubscriptionRequestForm from "@/components/forms/SubscriptionRequestForm";
import PlanAutoRenewActions from "@/components/dashboard/PlanAutoRenewActions";

interface PlanPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export async function generateMetadata({ params }: PlanPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("plan_section") };
}

export default async function PlanPage({ params, searchParams }: PlanPageProps) {
  const { locale } = await params;
  const { payment } = await searchParams;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const t = await getTranslations("dashboard");

  await connectDB();

  const rawBusiness = await Business.findOne({ ownerId: user.userId })
    .select("name plan planId featuredUntil status cancelAutoRenew mitFailedAt redsysIdentifier")
    .lean();

  if (!rawBusiness) redirect("/dashboard");

  const [rawPlans, rawPendingRequest, rawHistory] = await Promise.all([
    Plan.find({ isActive: true }).sort({ price: 1 }).lean(),
    SubscriptionRequest.findOne({ businessId: rawBusiness._id })
      .populate("planId", "name price priceMonthly priceYearly")
      .sort({ createdAt: -1 })
      .lean(),
    Subscription.find({ businessId: rawBusiness._id })
      .populate("planId", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const business = JSON.parse(JSON.stringify(rawBusiness)) as {
    _id: string;
    name: string;
    plan: "free" | "paid";
    featuredUntil?: string;
    status: string;
    cancelAutoRenew?: boolean;
    mitFailedAt?: string;
    redsysIdentifier?: string;
  };

  const plans = JSON.parse(JSON.stringify(rawPlans)) as {
    _id: string;
    name: { es: string; en: string } | string;
    price: number;
    priceMonthly: number;
    priceYearly: number;
    features: { es: string; en: string }[];
  }[];

  const pendingRequest = rawPendingRequest
    ? JSON.parse(JSON.stringify(rawPendingRequest))
    : null;

  const history = JSON.parse(JSON.stringify(rawHistory)) as {
    _id: string;
    planName: string;
    planId: { name: { es: string; en: string } | string } | null;
    price: number;
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled";
  }[];

  const now = new Date();
  const featuredUntil = business.featuredUntil
    ? new Date(business.featuredUntil)
    : null;
  const isPro = business.plan === "paid";
  const isPlanExpired = isPro && featuredUntil !== null && featuredUntil < now;
  const daysUntilExpiry = featuredUntil
    ? Math.ceil((featuredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon =
    isPro && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  // Expired but still within the 7-day grace period (cron hasn't downgraded yet)
  const daysOverdue = featuredUntil
    ? Math.ceil((now.getTime() - featuredUntil.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isInGracePeriod = isPlanExpired && daysOverdue !== null && daysOverdue <= 7;

  // Already downgraded to free but recently expired (within 7 days) — show grace warning
  // Covers both "expired" subs (cron ran) and "active" subs with past endDate (cron pending)
  const recentlyExpiredSub = !isPro
    ? history.find((s) => (s.status === "expired" || s.status === "active") &&
        new Date(s.endDate) < now &&
        (now.getTime() - new Date(s.endDate).getTime()) <= 7 * 24 * 60 * 60 * 1000)
    : null;

  const paidPlans = plans.filter((p) => (p.priceMonthly ?? p.price) > 0);
  const hasCardToken = !!business.redsysIdentifier;
  const mitFailed = !!business.mitFailedAt;

  function planDisplayName(name: { es: string; en: string } | string): string {
    if (typeof name === "string") return name;
    return locale === "en" ? name.en || name.es : name.es || name.en;
  }

  // Cleans up planName strings accidentally stored as JSON-like objects
  // e.g. "{ es: 'Básico', en: 'Basic' }" → locale-appropriate value
  function cleanPlanName(name: string): string {
    if (!name.includes("es:")) return name;
    const key = locale === "en" ? "en" : "es";
    const localeMatch = name.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
    if (localeMatch) return localeMatch[1];
    const esFallback = name.match(/es:\s*['"]([^'"]+)['"]/);
    return esFallback ? esFallback[1] : name;
  }

  const statusBadge = (status: string) => {
    if (status === "active")
      return (
        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
          {t("plan_status_active")}
        </span>
      );
    if (status === "expired")
      return (
        <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
          {t("plan_status_expired")}
        </span>
      );
    return (
      <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
        {t("plan_status_cancelled")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("plan_section")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{business.name}</p>
      </div>

      {payment === "ok" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">{t("payment_success")}</p>
        </div>
      )}
      {payment === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{t("payment_failed")}</p>
        </div>
      )}

      {/* Current plan status */}
      <div
        className={`rounded-2xl p-5 border flex items-start gap-4 ${
          isPlanExpired && !isInGracePeriod
            ? "bg-red-50 border-red-200"
            : isPlanExpired || isExpiringSoon || recentlyExpiredSub
            ? "bg-amber-50 border-amber-200"
            : isPro
            ? "bg-green-50 border-green-200"
            : "bg-muted border-border"
        }`}
      >
        <CreditCard
          className={`w-6 h-6 mt-0.5 shrink-0 ${
            isPlanExpired && !isInGracePeriod ? "text-red-600" : isPlanExpired || isExpiringSoon || recentlyExpiredSub ? "text-amber-600" : isPro ? "text-green-600" : "text-muted-foreground"
          }`}
        />
        <div className="space-y-1">
          <p
            className={`font-semibold text-sm ${
              isPlanExpired && !isInGracePeriod ? "text-red-800" : isPlanExpired || isExpiringSoon || recentlyExpiredSub ? "text-amber-800" : isPro ? "text-green-800" : "text-foreground"
            }`}
          >
            {t("plan_section")}:{" "}
            <span className="font-bold">
              {isPro ? t("plan_pro") : t("plan_free")}
            </span>
          </p>
          {isPro && featuredUntil && (
            <p
              className={`text-xs ${
                isPlanExpired && !isInGracePeriod ? "text-red-700" : isPlanExpired || isExpiringSoon ? "text-amber-700" : "text-green-700"
              }`}
            >
              {isPlanExpired && !isInGracePeriod
                ? t("plan_expired_warning")
                : isInGracePeriod
                ? t("plan_grace_warning")
                : isExpiringSoon
                ? t("plan_renewal_warning")
                : `${t("plan_expires")} ${featuredUntil.toLocaleDateString(locale)}`}
            </p>
          )}
          {!isPro && recentlyExpiredSub && (
            <p className="text-xs text-amber-700">
              {t("plan_grace_lost")}
            </p>
          )}
          {!isPro && !recentlyExpiredSub && (
            <p className="text-xs text-muted-foreground">
              {t("plan_upgrade_hint_free")}
            </p>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div className={`grid grid-cols-1 gap-4 ${paidPlans.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-sm"}`}>
        {paidPlans.map((plan) => (
          <div
            key={plan._id}
            className={`bg-card rounded-2xl p-5 border space-y-4 ${
              isPro && !isPlanExpired ? "border-primary ring-1 ring-primary/20" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground">
                {planDisplayName(plan.name)}
              </h2>
              {isPro && !isPlanExpired && (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                  {t("plan_current_badge")}
                </span>
              )}
            </div>
            {/* Monthly / Yearly prices */}
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {plan.priceMonthly ?? plan.price} €
                <span className="text-sm font-normal text-muted-foreground">{t("plan_per_month")}</span>
              </p>
              {(plan.priceYearly ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                  o{" "}
                  <span className="font-semibold text-foreground">{plan.priceYearly} €</span>
                  {t("plan_per_year")}
                </p>
              )}
            </div>
            <ul className="space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground font-medium">
                  <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {locale === "en" ? f.en || f.es : f.es || f.en}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* MIT failed — card needs updating */}
      {isPro && mitFailed && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">{t("plan_renewal_failed_title")}</p>
            <p className="text-xs text-red-700 mt-0.5">{t("plan_renewal_failed_desc")}</p>
          </div>
        </div>
      )}

      {/* Auto-renewal toggle — only for Pro users with a stored card token */}
      {isPro && !isPlanExpired && hasCardToken && (
        <PlanAutoRenewActions cancelAutoRenew={!!business.cancelAutoRenew} />
      )}

      {/* Subscription request form — only for active businesses */}
      {(!isPro || isPlanExpired || mitFailed) && (
        business.status === "active" ? (
          <SubscriptionRequestForm plans={plans} pendingRequest={pendingRequest} locale={locale} />
        ) : (
          <div className="bg-muted border border-border rounded-2xl p-5 text-sm text-muted-foreground">
            {t("plan_requires_active")}
          </div>
        )
      )}

      {/* Subscription history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-foreground text-sm">
              {t("plan_history")}
            </h2>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">{t("plan_col_plan")}</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">{t("plan_col_start")}</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">{t("plan_col_end")}</th>
                  <th className="text-left px-4 py-2 font-medium">{t("plan_col_price")}</th>
                  <th className="text-left px-4 py-2 font-medium">{t("plan_col_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((sub) => (
                  <tr key={sub._id} className="bg-card">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {sub.planId ? planDisplayName(sub.planId.name) : cleanPlanName(sub.planName)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(sub.startDate).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(sub.endDate).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.price} €</td>
                    <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
