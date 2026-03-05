import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { BusinessReview } from "@/models/BusinessReview";
import { getTranslations } from "next-intl/server";
import StarRating from "@/components/business/StarRating";
import { Link } from "@/lib/navigation";
import BackButton from "@/components/ui/BackButton";
import { UserCircle2 } from "lucide-react";
import type { Metadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const user = await User.findById(id).select("name").lean().catch(() => null);
  if (!user) return { title: "Usuario no encontrado" };
  return { title: user.name };
}

export default async function PublicUserProfilePage({ params }: UserProfilePageProps) {
  const { locale, id } = await params;
  const t = await getTranslations("userProfile");
  const tReviews = await getTranslations("reviews");

  await connectDB();

  const rawUser = await User.findById(id)
    .select("name avatar createdAt role")
    .lean()
    .catch(() => null);

  // Only show profiles for regular "user" role customers
  if (!rawUser || rawUser.role !== "user") notFound();

  const rawBizReviews = await BusinessReview.find({ userId: id, isPublished: true })
    .populate("businessId", "name slug")
    .sort({ createdAt: -1 })
    .lean();

  const user = {
    name: rawBizReviews.length > 0 ? rawUser.name : rawUser.name,
    avatar: rawUser.avatar as string | undefined,
    memberSince: new Date(rawUser.createdAt as Date).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
    }),
  };

  const bizReviews = JSON.parse(JSON.stringify(rawBizReviews)) as Array<{
    _id: string;
    rating: number;
    text: string;
    createdAt: string;
    businessId: { name: string; slug: string } | null;
  }>;

  const avgRating =
    bizReviews.length > 0
      ? bizReviews.reduce((s, r) => s + r.rating, 0) / bizReviews.length
      : null;

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* Back */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <BackButton label={t("back")} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile header */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex items-center gap-4">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <UserCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-foreground leading-tight">
              {user.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("member_since")} {user.memberSince}
            </p>
            {avgRating !== null && (
              <div className="flex items-center gap-1.5 mt-2">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="text-xs text-muted-foreground">
                  {avgRating.toFixed(1)} · {bizReviews.length}{" "}
                  {bizReviews.length === 1 ? t("review_singular") : t("review_plural")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Business reviews received */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("reviews_from_businesses")}{" "}
            {bizReviews.length > 0 && (
              <span className="text-muted-foreground font-normal text-base">
                ({bizReviews.length})
              </span>
            )}
          </h2>

          {bizReviews.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {t("no_reviews")}
            </div>
          ) : (
            <div className="space-y-3">
              {bizReviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-card border border-border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      {review.businessId ? (
                        <Link
                          href={("/empresa/" + review.businessId.slug) as `/empresa/${string}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {review.businessId.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
