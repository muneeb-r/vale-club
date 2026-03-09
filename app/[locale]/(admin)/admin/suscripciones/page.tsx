import { connectDB } from "@/lib/db";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { getTranslations } from "next-intl/server";
import SubscriptionQueue from "@/components/admin/SubscriptionQueue";
import PaginationBar from "@/components/ui/PaginationBar";

const LIMIT = 20;

interface SubsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

export async function generateMetadata({ params }: SubsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("subscriptions") };
}

export default async function AdminSuscripcionesPage({ params, searchParams }: SubsPageProps) {
  const { locale } = await params;
  void locale;
  const { status = "pending", page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));
  const t = await getTranslations("admin");

  await connectDB();

  const filter = status === "all" ? {} : { status };

  const [rawRequests, total, pendingCount] = await Promise.all([
    SubscriptionRequest.find(filter)
      .populate("businessId", "name slug plan")
      .populate("planId", "name price features")
      .sort({ createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    SubscriptionRequest.countDocuments(filter),
    SubscriptionRequest.countDocuments({ status: "pending" }),
  ]);

  const requests = JSON.parse(JSON.stringify(rawRequests)) as {
    _id: string;
    status: "pending" | "approved" | "rejected";
    billingCycle?: "monthly" | "yearly";
    paymentNote: string;
    paymentProofUrl?: string;
    adminNote: string;
    createdAt: string;
    businessId: { _id: string; name: string; slug: string; plan: string } | null;
    planId: { _id: string; name: { es: string; en: string } | string; price: number; features: { es: string; en: string }[] } | null;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("subscriptions")}
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">
              {pendingCount} solicitud{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/suscripciones?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s === "all" ? t("sub_filter_all") : t(`sub_${s}`)}
          </a>
        ))}
      </div>

      <SubscriptionQueue requests={requests} />

      <PaginationBar
        page={page}
        total={total}
        limit={LIMIT}
        buildUrl={(p) => {
          const params = new URLSearchParams();
          params.set("page", String(p));
          if (status !== "pending") params.set("status", status);
          return `/admin/suscripciones?${params.toString()}`;
        }}
      />
    </div>
  );
}
