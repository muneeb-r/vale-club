import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Review } from "@/models/Review";
import { BusinessReview } from "@/models/BusinessReview";
import { ShopOrder } from "@/models/ShopOrder";
import UserProfileForm from "@/components/forms/UserProfileForm";
import StarRating from "@/components/business/StarRating";
import ReviewEditForm from "@/components/forms/ReviewEditForm";
import PaginationBar from "@/components/ui/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/navigation";
import { Package, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const ORDER_STATUS_CONFIG = {
  new:         { color: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Clock },
  in_progress: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Loader2 },
  done:        { color: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  cancelled:   { color: "bg-red-50 text-red-700 border-red-200",       Icon: XCircle },
} as const;

interface PerfilPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PerfilPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title") };
}

const LIMIT = 10;

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const jwtUser = await getServerUser();
  if (!jwtUser) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const t = await getTranslations("profile");
  const tReviews = await getTranslations("reviews");

  await connectDB();

  const rawUser = await User.findById(jwtUser.userId)
    .select("name email avatar createdAt")
    .lean();
  if (!rawUser) redirect("/login");

  const reviewFilter = { userId: jwtUser.userId };

  const [rawReviews, total, rawBizReviews, rawOrders] = await Promise.all([
    Review.find(reviewFilter)
      .populate("businessId", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    Review.countDocuments(reviewFilter),
    BusinessReview.find({ userId: jwtUser.userId, isPublished: true })
      .populate("businessId", "name slug")
      .sort({ createdAt: -1 })
      .lean(),
    ShopOrder.find({ email: jwtUser.email })
      .populate("serviceId", "name priceType price promoPrice")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const user = JSON.parse(JSON.stringify(rawUser)) as {
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
  };

  const reviews = JSON.parse(JSON.stringify(rawReviews)) as Array<{
    _id: string;
    rating: number;
    text: string;
    proofUrl: string;
    proofStatus: "pending" | "approved" | "rejected";
    proofNote?: string;
    isPublished: boolean;
    createdAt: string;
    businessId: { name: string; slug: string } | null;
  }>;

  const bizReviews = JSON.parse(JSON.stringify(rawBizReviews)) as Array<{
    _id: string;
    rating: number;
    text: string;
    createdAt: string;
    businessId: { name: string; slug: string } | null;
  }>;

  const orders = JSON.parse(JSON.stringify(rawOrders)) as Array<{
    _id: string;
    serviceId?: { name: { es: string; en: string; ca: string }; price?: number; promoPrice?: number };
    type: "purchase" | "quote";
    message: string;
    status: keyof typeof ORDER_STATUS_CONFIG;
    adminNote: string;
    createdAt: string;
  }>;

  const tShop = await getTranslations("shop");

  const statusBadge = (
    status: "pending" | "approved" | "rejected",
    isPublished: boolean
  ) => {
    if (isPublished)
      return (
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
          {tReviews("approved_badge")}
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge className="bg-red-100 text-red-700 border-0 text-xs">
          {tReviews("rejected_badge")}
        </Badge>
      );
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
        {tReviews("pending_badge")}
      </Badge>
    );
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-10">
        {/* Profile section */}
        <section className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <UserProfileForm
            initialName={user.name}
            initialAvatar={user.avatar}
          />
        </section>

        {/* Reviews section */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("my_reviews")}{" "}
            {total > 0 && (
              <span className="text-muted-foreground font-normal text-base">({total})</span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_reviews")}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-card border border-border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      {review.businessId ? (
                        <Link
                          href={
                            (
                              "/empresa/" + review.businessId.slug
                            ) as `/empresa/${string}`
                          }
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {review.businessId.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {statusBadge(review.proofStatus, review.isPublished)}
                  </div>

                  <StarRating value={review.rating} readonly size="sm" />
                  <p className="text-sm text-muted-foreground">{review.text}</p>

                  {review.proofNote && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                      {tReviews("proof_note")}: {review.proofNote}
                    </p>
                  )}

                  <ReviewEditForm
                    reviewId={review._id}
                    initialRating={review.rating}
                    initialText={review.text}
                    initialProofUrl={review.proofUrl}
                    proofStatus={review.proofStatus}
                    isPublished={review.isPublished}
                  />
                </div>
              ))}
            </div>
          )}

          <PaginationBar
            page={page}
            total={total}
            limit={LIMIT}
            buildUrl={(p) => `/perfil?page=${p}`}
          />
        </section>

        {/* ── Business reviews received ── */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {tReviews("biz_review_title")}{" "}
            {bizReviews.length > 0 && (
              <span className="text-muted-foreground font-normal text-base">
                ({bizReviews.length})
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            {tReviews("biz_review_received")}
          </p>

          {bizReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tReviews("biz_review_no_received")}
            </p>
          ) : (
            <div className="space-y-3">
              {bizReviews.map((br) => (
                <div
                  key={br._id}
                  className="bg-card border border-border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      {br.businessId ? (
                        <Link
                          href={("/empresa/" + br.businessId.slug) as `/empresa/${string}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {br.businessId.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(br.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {tReviews("biz_review_title")}
                    </span>
                  </div>
                  <StarRating value={br.rating} readonly size="sm" />
                  <p className="text-sm text-muted-foreground">{br.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Shop orders ── */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {tShop("my_orders_title")}
            {orders.length > 0 && (
              <span className="text-muted-foreground font-normal text-base">({orders.length})</span>
            )}
          </h2>

          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tShop("my_orders_empty")}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.new;
                const { Icon } = cfg;
                const price = order.serviceId?.promoPrice ?? order.serviceId?.price;
                return (
                  <div key={order._id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {order.serviceId?.name?.es ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.type === "quote" ? tShop("my_orders_type_quote") : tShop("my_orders_type_purchase")}
                          {price ? ` · ${price} €` : ""}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium shrink-0 ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {tShop(`my_orders_status_${order.status}` as Parameters<typeof tShop>[0])}
                      </span>
                    </div>

                    {order.message && (
                      <div className="bg-muted/50 rounded-xl px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">{tShop("my_orders_message")}</p>
                        <p className="text-sm text-foreground">{order.message}</p>
                      </div>
                    )}

                    {order.adminNote && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                        <p className="text-xs text-primary font-medium mb-0.5">Nota del equipo</p>
                        <p className="text-sm text-foreground">{order.adminNote}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {tShop("my_orders_date")}: {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
