import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Review } from "@/models/Review";
import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import ContactButtons from "@/components/business/ContactButtons";
import Gallery from "@/components/business/Gallery";
import ReviewsList from "@/components/business/ReviewsList";
import ReviewSection from "@/components/business/ReviewSection";
import { Star, MapPin, BadgeCheck, Zap } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { Link } from "@/lib/navigation";
import BackButton from "@/components/ui/BackButton";
import type { Metadata } from "next";

interface BusinessPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const BASE_URL = process.env.APP_URL || "https://vale.club";

export async function generateMetadata({
  params,
}: BusinessPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  await connectDB();
  const business = await Business.findOne({
    slug,
    status: { $in: ["active", "inreview"] },
  }).lean();
  if (!business) return { title: "Empresa no encontrada" };

  const description = business.description.slice(0, 160);
  const ogImages = [
    ...(business.logo ? [{ url: business.logo, alt: business.name }] : []),
    ...(business.gallery ?? [])
      .slice(0, 3)
      .map((url: string) => ({ url, alt: business.name })),
  ];

  const canonicalPath = `/empresa/${slug}`;
  const canonicalUrl =
    locale === "es"
      ? `${BASE_URL}${canonicalPath}`
      : `${BASE_URL}/${locale}${canonicalPath}`;

  return {
    title: `${business.name} — VALE`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${BASE_URL}${canonicalPath}`,
        en: `${BASE_URL}/en${canonicalPath}`,
        ca: `${BASE_URL}/ca${canonicalPath}`,
      },
    },
    openGraph: {
      title: business.name,
      description,
      url: canonicalUrl,
      type: "website",
      images: ogImages.length > 0 ? ogImages : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: business.name,
      description,
      images: ogImages.length > 0 ? [ogImages[0].url] : undefined,
    },
  };
}

export default async function BusinessProfilePage({
  params,
  searchParams,
}: BusinessPageProps) {
  const { locale, slug } = await params;
  const rawSearchParams = await searchParams;
  const reviewSearchParams: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(rawSearchParams)) {
    if (typeof v === "string") reviewSearchParams[k] = v;
  }
  const t = await getTranslations("business");
  const tReviews = await getTranslations("reviews");
  const tNav = await getTranslations("nav");

  await connectDB();

  const rawBusiness = await Business.findOne({
    slug,
    status: "active",
  })
    .populate("categories", "name nameEn slug icon")
    .lean();

  if (!rawBusiness) notFound();

  const business = JSON.parse(JSON.stringify(rawBusiness));
  const categories = business.categories as Array<{
    name: string;
    nameEn: string;
    icon: string;
    slug: string;
  }>;

  // Check auth to decide if review button shows
  const currentUser = await getServerUser();
  const canReview = currentUser?.role === "user";

  // Check if user has already reviewed this business
  let alreadyReviewed = false;
  if (canReview) {
    const existing = await Review.findOne({
      businessId: rawBusiness._id,
      userId: currentUser!.userId,
    });
    alreadyReviewed = !!existing;
  }

  let loginMessage = tReviews("login_to_review");
  if (canReview && alreadyReviewed) {
    loginMessage = tReviews("already_reviewed");
  }

  const featuredGrace = new Date();
  featuredGrace.setDate(featuredGrace.getDate() - 7);
  const isFeaturedVisible =
    business.plan === "paid" &&
    !!business.featuredUntil &&
    new Date(business.featuredUntil) > featuredGrace;

  const canonicalPath = `/empresa/${slug}`;
  const pageUrl =
    locale === "es"
      ? `${BASE_URL}${canonicalPath}`
      : `${BASE_URL}/${locale}${canonicalPath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    url: pageUrl,
    ...(business.logo && { image: business.logo }),
    ...(business.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: business.rating.toFixed(1),
        reviewCount: business.reviewCount,
        bestRating: "4",
        worstRating: "1",
      },
    }),
    ...(business.location?.city && {
      address: {
        "@type": "PostalAddress",
        addressLocality: business.location.city,
        ...(business.location.address && {
          streetAddress: business.location.address,
        }),
      },
    }),
    ...(categories.length > 0 && {
      knowsAbout: categories.map((c: { name: string }) => c.name),
    }),
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <BackButton label={tNav("directory")} href="/search" />
      </div>

      {/* Business header */}
      <div className="bg-card border-b border-border mt-4">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-start gap-3 md:gap-5">
            {business.logo ? (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 shadow-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <CategoryIcon
                  icon={categories[0]?.icon ?? ""}
                  size="lg"
                  className="text-foreground"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {business.name}
                </h1>
                <BadgeCheck className="w-6 h-6 text-primary shrink-0" />
                {isFeaturedVisible && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                    <Zap className="w-3 h-3" />
                    {t("featured_badge")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((cat) => (
                  <span
                    key={cat.name}
                    className="text-xs bg-muted text-primary px-3 py-1 rounded-full inline-flex items-center gap-1.5"
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      size="sm"
                      className="text-primary"
                    />
                    {locale === "en" ? cat.nameEn : cat.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                {business.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <strong className="text-foreground">
                      {business.rating.toFixed(1)}
                    </strong>{" "}
                    ({business.reviewCount} {t("reviews")})
                  </span>
                )}
                {business.location?.city && (
                  <a
                    href={
                      business.location.coordinates?.lat &&
                      business.location.coordinates?.lng
                        ? `https://www.google.com/maps?q=${business.location.coordinates.lat},${business.location.coordinates.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.location.city)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    {business.location.city}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Contact card — shows first on mobile, right sidebar on desktop */}
          <div className="w-full md:w-72 md:order-last shrink-0">
            <div className="md:sticky md:top-20">
              <ContactButtons business={business} />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6 md:space-y-8 min-w-0">
            {/* Description */}
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                {t("about")}
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {business.description}
              </p>
            </section>

            {/* Prices */}
            {(business.prices || business.pricesFileUrl) && (
              <section>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                  {t("prices")}
                </h2>
                {(!business.pricesType || business.pricesType === "text") && business.prices && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {business.prices}
                  </p>
                )}
                {business.pricesType === "image" && business.pricesFileUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.pricesFileUrl}
                    alt={t("prices")}
                    className="max-w-full rounded-2xl border border-border"
                  />
                )}
                {business.pricesType === "pdf" && business.pricesFileUrl && (
                  <a
                    href={business.pricesFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Ver carta / precios (PDF)
                  </a>
                )}
              </section>
            )}

            {/* Location */}
            {(business.location?.address || business.location?.city) &&
              (() => {
                const loc = business.location;
                const displayParts = [loc.address, loc.city, loc.country]
                  .filter(Boolean)
                  .filter(
                    (v, i, arr) =>
                      !arr.some((other, j) => j !== i && other?.includes(v!)),
                  );
                const displayText = displayParts.join(", ");
                const mapsUrl =
                  loc.coordinates?.lat && loc.coordinates?.lng
                    ? `https://www.google.com/maps?q=${loc.coordinates.lat},${loc.coordinates.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || loc.city || "")}`;
                return (
                  <section>
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                      {t("location")}
                    </h2>
                    {loc.placeName && (
                      <p className="text-sm font-medium text-foreground mb-1">
                        {loc.placeName}
                      </p>
                    )}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      {displayText}
                    </a>
                  </section>
                );
              })()}

            {/* Gallery */}
            {business.gallery?.length > 0 && (
              <section>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                  {t("photos")}
                </h2>
                <Gallery
                  images={business.gallery}
                  businessName={business.name}
                />
              </section>
            )}

            {/* Reviews */}
            <section id="reviews" className="space-y-4 scroll-mt-24">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {tReviews("title")}
              </h2>

              <ReviewSection
                businessId={business._id}
                canReview={canReview && !alreadyReviewed}
                loginMessage={loginMessage}
              />

              <ReviewsList
                businessId={business._id}
                locale={locale}
                slug={slug}
                businessRating={business.rating ?? 0}
                businessReviewCount={business.reviewCount ?? 0}
                searchParams={reviewSearchParams}
                currentUserId={currentUser?.userId}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
