import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Review } from "@/models/Review";
import { BusinessReview } from "@/models/BusinessReview";
import StarRating from "@/components/business/StarRating";
import ReviewReplyForm from "@/components/business/ReviewReplyForm";
import BusinessReviewForm from "@/components/forms/BusinessReviewForm";
import PaginationBar from "@/components/ui/PaginationBar";
import DashboardReviewFilters from "@/components/business/DashboardReviewFilters";
import { Link } from "@/lib/navigation";
import { Suspense } from "react";
// Suspense wraps DashboardReviewFilters (uses useSearchParams)

interface ResenasPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; rating?: string; sort?: string }>;
}

export async function generateMetadata({ params }: ResenasPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("reviews") };
}

const LIMIT = 10;

export default async function ResenasPage({ searchParams }: ResenasPageProps) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const { page: pageParam, rating: ratingParam, sort: sortParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));
  const ratingFilter = parseInt(ratingParam || "0");
  const sort: Record<string, 1 | -1> = sortParam === "highest" ? { rating: -1 } : sortParam === "lowest" ? { rating: 1 } : { createdAt: -1 };

  const t = await getTranslations("dashboard");
  const tReviews = await getTranslations("reviews");

  await connectDB();

  const business = await Business.findOne({ ownerId: user.userId }).lean();

  if (!business) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("reviews")}
        </h1>
        <p className="text-muted-foreground">{t("no_business")}</p>
      </div>
    );
  }

  const filter: Record<string, unknown> = { businessId: business._id, isPublished: true };
  if (ratingFilter > 0) filter.rating = ratingFilter;

  const [rawReviews, total] = await Promise.all([
    Review.find(filter)
      .populate("userId", "name email avatar")
      .sort(sort)
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const reviews = JSON.parse(JSON.stringify(rawReviews)) as Array<{
    _id: string;
    rating: number;
    text: string;
    businessReply?: string;
    businessRepliedAt?: string;
    createdAt: string;
    userId: { _id: string; name: string; email: string; avatar?: string } | null;
  }>;

  // Fetch existing business→customer reviews so we can pre-fill the edit form
  const rawBizReviews = await BusinessReview.find({ businessId: business._id })
    .select("userId rating text")
    .lean();

  const bizReviewMap = new Map<string, { rating: number; text: string }>(
    rawBizReviews.map((r) => [String(r.userId), { rating: r.rating, text: r.text }])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("reviews")}{" "}
            {total > 0 && (
              <span className="text-muted-foreground font-normal text-lg">({total})</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tReviews("biz_review_not_eligible")}
          </p>
        </div>
        <Suspense fallback={null}>
          <DashboardReviewFilters />
        </Suspense>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
          {tReviews("no_reviews")}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const userId = review.userId?._id;
            const existingBizReview = userId ? bizReviewMap.get(userId) : undefined;

            return (
              <div
                key={review._id}
                className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3"
              >
                {/* Reviewer info + date */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    {review.userId?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.userId.avatar}
                        alt={review.userId.name}
                        className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {review.userId?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {review.userId ? (
                        <Link
                          href={(`/usuario/${review.userId._id}`) as `/usuario/${string}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {review.userId.name}
                        </Link>
                      ) : (
                        <p className="font-medium text-sm text-foreground">Usuario</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {review.userId?.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Customer's review of the business */}
                <StarRating value={review.rating} readonly size="sm" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.text}
                </p>

                {/* Business reply to customer's review */}
                <ReviewReplyForm
                  reviewId={review._id}
                  initialReply={review.businessReply}
                />

                {/* ── Bidirectional: business reviews the customer ── */}
                {userId && (
                  <div className="border-t border-border pt-3 mt-1">
                    <BusinessReviewForm
                      userId={userId}
                      userName={review.userId?.name || "Cliente"}
                      existing={existingBizReview}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PaginationBar
        page={page}
        total={total}
        limit={LIMIT}
        buildUrl={(p) => {
          const params = new URLSearchParams();
          params.set("page", String(p));
          if (ratingParam) params.set("rating", ratingParam);
          if (sortParam) params.set("sort", sortParam);
          return `/dashboard/resenas?${params.toString()}`;
        }}
      />
    </div>
  );
}
