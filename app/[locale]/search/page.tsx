import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Category } from "@/models/Category";
import { getTranslations } from "next-intl/server";
import BusinessGrid from "@/components/business/BusinessGrid";
import { Suspense } from "react";
import BusinessFiltersWrapper from "@/components/business/BusinessFiltersWrapper";
import SurpriseButton from "@/components/business/SurpriseButton";
import SearchModal from "@/components/business/SearchModal";
import type { Metadata } from "next";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const rawParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "search" });
  const q = typeof rawParams.q === "string" ? rawParams.q : "";

  const title = q ? t("meta_title_query", { q }) : t("meta_title_default");
  const description = q ? t("meta_description_query", { q }) : t("meta_description_default");

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: locale === "es" ? "/search" : `/${locale}/search`,
    },
  };
}

const LIMIT = 12;

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const t = await getTranslations("search");

  const q = typeof rawParams.q === "string" ? rawParams.q : "";
  const category =
    typeof rawParams.category === "string" ? rawParams.category : "";
  const city = typeof rawParams.city === "string" ? rawParams.city : "";
  const lat = parseFloat(
    typeof rawParams.lat === "string" ? rawParams.lat : "",
  );
  const lng = parseFloat(
    typeof rawParams.lng === "string" ? rawParams.lng : "",
  );
  const radius = parseInt(
    typeof rawParams.radius === "string" ? rawParams.radius : "0",
  );
  const minRating = parseFloat(
    typeof rawParams.minRating === "string" ? rawParams.minRating : "0",
  );
  const featuredOnly = rawParams.featured === "1";
  const page = Math.max(
    1,
    parseInt(typeof rawParams.page === "string" ? rawParams.page : "1"),
  );

  await connectDB();

  const filter: Record<string, unknown> = { status: "active" };
  if (category) filter.categories = category;

  // $geoWithin + $centerSphere works with .sort() unlike $near
  // Earth radius = 6378.1 km; $centerSphere radius is in radians
  if (radius > 0 && !isNaN(lat) && !isNaN(lng)) {
    filter["location.geoPoint"] = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6378.1],
      },
    };
  } else if (city) {
    filter["location.city"] = new RegExp(city, "i");
  }

  if (minRating > 0) filter.rating = { $gte: minRating };
  if (q) filter.$text = { $search: q };
  if (featuredOnly) filter.plan = "paid";

  const projection = q ? { score: { $meta: "textScore" } } : undefined;
  const sortOptions = q
    ? ({ score: { $meta: "textScore" } } as Record<string, { $meta: string }>)
    : ({ plan: -1, rating: -1, reviewCount: -1, createdAt: -1 } as Record<
        string,
        -1
      >);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawBusinesses: any[];
  let total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawCategories: any[];

  try {
    [rawBusinesses, total, rawCategories] = await Promise.all([
      Business.find(filter, projection)
        .sort(sortOptions)
        .skip((page - 1) * LIMIT)
        .limit(LIMIT)
        .populate("categories", "name nameEn slug icon")
        .lean(),
      Business.countDocuments(filter),
      Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);
  } catch (err: unknown) {
    // Text index not yet built — fall back to regex on name
    const code = (err as { code?: number })?.code;
    if (q && code === 27) {
      delete filter.$text;
      delete filter.score;
      filter.name = { $regex: q, $options: "i" };
      const fallbackSort = { plan: -1, rating: -1, reviewCount: -1, createdAt: -1 } as Record<string, -1>;
      [rawBusinesses, total, rawCategories] = await Promise.all([
        Business.find(filter)
          .sort(fallbackSort)
          .skip((page - 1) * LIMIT)
          .limit(LIMIT)
          .populate("categories", "name nameEn slug icon")
          .lean(),
        Business.countDocuments(filter),
        Category.find({ isActive: true }).sort({ order: 1 }).lean(),
      ]);
    } else {
      throw err;
    }
  }

  const businesses = JSON.parse(JSON.stringify(rawBusinesses));
  const categories = JSON.parse(JSON.stringify(rawCategories));

  const plainSearchParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawParams)) {
    if (typeof v === "string") plainSearchParams[k] = v;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search header bar */}
      <div className="border-b border-border bg-card py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-heading text-base sm:text-xl font-semibold text-foreground shrink-0">
                {q ? (
                  <>
                    {t("results_for")}{" "}
                    <span className="text-primary">&ldquo;{q}&rdquo;</span>{" "}
                    <span className="text-muted-foreground font-normal text-sm sm:text-base">
                      ({total})
                    </span>
                  </>
                ) : (
                  <>
                    {t("directory_title")}{" "}
                    <span className="text-muted-foreground font-normal text-sm sm:text-base">
                      — {total}{" "}
                      {total === 1
                        ? t("business_singular")
                        : t("business_plural")}
                    </span>
                  </>
                )}
              </h1>
              <div className="hidden sm:block">
                <Suspense fallback={<div className="w-8 h-8" />}>
                  <SearchModal />
                </Suspense>
              </div>
            </div>
            <SurpriseButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Mobile: filters above results, full-width */}
        <div className="md:hidden mb-4">
          <Suspense
            fallback={
              <div className="h-10 bg-muted rounded-full animate-pulse" />
            }
          >
            <BusinessFiltersWrapper categories={categories} locale={locale} />
          </Suspense>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop: filters sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <Suspense
              fallback={
                <div className="h-64 bg-muted rounded-2xl animate-pulse" />
              }
            >
              <BusinessFiltersWrapper categories={categories} locale={locale} />
            </Suspense>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            <BusinessGrid
              businesses={businesses}
              total={total}
              page={page}
              limit={LIMIT}
              locale={locale}
              searchParams={plainSearchParams}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
