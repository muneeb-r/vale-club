import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Review } from "@/models/Review";
import { BusinessReview } from "@/models/BusinessReview";
import UserProfileForm from "@/components/forms/UserProfileForm";
import StarRating from "@/components/business/StarRating";
import ReviewEditForm from "@/components/forms/ReviewEditForm";
import PaginationBar from "@/components/ui/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/navigation";

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

  const [rawReviews, total, rawBizReviews] = await Promise.all([
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
      </div>
    </main>
  );
}
