import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { getTranslations } from "next-intl/server";
import StarRating from "@/components/business/StarRating";
import ReviewSortSelect from "@/components/business/ReviewSortSelect";
import ReviewCard from "@/components/business/ReviewCard";
import { Link } from "@/lib/navigation";
import { Star } from "lucide-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

const PAGE_SIZE = 5;

interface ReviewsListProps {
  businessId: string;
  locale: string;
  businessRating: number;
  businessReviewCount: number;
  searchParams: Record<string, string | undefined>;
  slug: string;
  currentUserId?: string;
}

export default async function ReviewsList({
  businessId,
  locale,
  businessRating,
  businessReviewCount,
  searchParams,
  slug,
  currentUserId,
}: ReviewsListProps) {
  const t = await getTranslations("reviews");
  const tSearch = await getTranslations("search");

  const starFilter = searchParams.star ? parseInt(searchParams.star) : null;
  const sort = searchParams.sort ?? "recent";
  const page = Math.max(1, parseInt(searchParams.rpage ?? "1"));

  const sortMap = {
    recent: { createdAt: -1 as const },
    highest: { rating: -1 as const, createdAt: -1 as const },
    lowest: { rating: 1 as const, createdAt: -1 as const },
  } as const;
  const sortQuery = sortMap[sort as keyof typeof sortMap] ?? sortMap.recent;

  await connectDB();

  // Breakdown across ALL published reviews (for the bar chart — ignores star/page filter)
  const allReviews = await Review.find({ businessId, isPublished: true }).select("rating").lean();
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of allReviews) {
    const s = Math.round(r.rating);
    if (s >= 1 && s <= 5) breakdown[s] = (breakdown[s] ?? 0) + 1;
  }

  // Paginated filtered query
  const filterQuery: Record<string, unknown> = { businessId, isPublished: true };
  if (starFilter !== null) filterQuery.rating = { $gte: starFilter - 0.5, $lt: starFilter + 0.5 };

  const [rawReviews, filteredTotal] = await Promise.all([
    Review.find(filterQuery)
      .populate("userId", "name avatar _id")
      .sort(sortQuery)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Review.countDocuments(filterQuery),
  ]);

  const reviews = JSON.parse(JSON.stringify(rawReviews));
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);

  // Build URL helper — preserves existing params, sets/clears a key
  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams();
    // carry forward existing params that are relevant to reviews
    for (const k of ["star", "sort", "rpage"]) {
      const v = searchParams[k];
      if (v) params.set(k, v);
    }
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    // Reset page when filter/sort changes
    if (updates.star !== undefined || updates.sort !== undefined) params.delete("rpage");
    const qs = params.toString();
    return (`/empresa/${slug}` + (qs ? `?${qs}` : "") + "#reviews") as `/empresa/${string}`;
  }

  if (allReviews.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("no_reviews")}</p>;
  }

  return (
    <div className="space-y-5">
      {/* ── Rating summary + breakdown ── */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="flex flex-col items-center justify-center sm:w-28 shrink-0 text-center">
          <p className="text-4xl sm:text-5xl font-bold text-foreground leading-none">
            {businessRating.toFixed(1)}
          </p>
          <StarRating value={Math.round(businessRating)} readonly size="sm" />
          <p className="text-xs text-muted-foreground mt-1">
            {businessReviewCount} {t("title").toLowerCase()}
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] ?? 0;
            const pct = businessReviewCount > 0 ? Math.round((count / businessReviewCount) * 100) : 0;
            const isActive = starFilter === star;
            const href = buildUrl({ star: isActive ? null : String(star) });
            return (
              <Link
                key={star}
                href={href}
                className={`w-full flex items-center gap-2.5 rounded-lg px-1 py-0.5 transition-colors ${
                  isActive ? "bg-primary/8" : "hover:bg-muted/60"
                }`}
              >
                <span className={`text-xs font-medium w-3 shrink-0 text-right ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {star}
                </span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isActive ? "bg-primary" : "bg-yellow-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs w-8 text-right shrink-0 tabular-nums ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {count > 0 ? count : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Filter chips + Sort dropdown ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Star filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0">
          <Link
            href={buildUrl({ star: null })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              starFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t("all_ratings")}
          </Link>
          {[5, 4, 3, 2, 1].map((star) => (
            <Link
              key={star}
              href={buildUrl({ star: starFilter === star ? null : String(star) })}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                starFilter === star
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {star} <Star className="w-2.5 h-2.5 fill-current" />
            </Link>
          ))}
        </div>

        {/* Sort dropdown */}
        <ReviewSortSelect sort={sort} slug={slug} />
      </div>

      {/* ── Review cards ── */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_filtered_reviews")}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: {
            _id: string;
            rating: number;
            text: string;
            createdAt: string;
            businessReply?: string;
            userId: { _id: string; name: string; avatar?: string } | null;
          }) => (
            <ReviewCard
              key={review._id}
              review={review}
              locale={locale}
              isOwn={!!(currentUserId && review.userId?._id === currentUserId)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (() => {
        function buildPageRange(current: number, total: number): (number | "…")[] {
          if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
          const pages: (number | "…")[] = [1];
          if (current > 3) pages.push("…");
          const start = Math.max(2, current - 1);
          const end = Math.min(total - 1, current + 1);
          for (let i = start; i <= end; i++) pages.push(i);
          if (current < total - 2) pages.push("…");
          pages.push(total);
          return pages;
        }
        return (
          <Pagination className="pt-2">
            <PaginationContent>
              {/* Previous */}
              <PaginationItem>
                {page > 1 ? (
                  <Link
                    href={buildUrl({ rpage: String(page - 1) })}
                    aria-label="Go to previous page"
                    className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pl-2.5")}
                  >
                    <ChevronLeftIcon className="size-4" />
                    <span className="hidden sm:block">{tSearch("previous")}</span>
                  </Link>
                ) : (
                  <span className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pl-2.5 pointer-events-none opacity-50")}>
                    <ChevronLeftIcon className="size-4" />
                    <span className="hidden sm:block">{tSearch("previous")}</span>
                  </span>
                )}
              </PaginationItem>

              {/* Numbered pages */}
              {buildPageRange(page, totalPages).map((entry, i) =>
                entry === "…" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={entry}>
                    <Link
                      href={buildUrl({ rpage: String(entry) })}
                      aria-current={entry === page ? "page" : undefined}
                      className={cn(buttonVariants({ variant: entry === page ? "outline" : "ghost", size: "icon" }))}
                    >
                      {entry}
                    </Link>
                  </PaginationItem>
                )
              )}

              {/* Next */}
              <PaginationItem>
                {page < totalPages ? (
                  <Link
                    href={buildUrl({ rpage: String(page + 1) })}
                    aria-label="Go to next page"
                    className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pr-2.5")}
                  >
                    <span className="hidden sm:block">{tSearch("next")}</span>
                    <ChevronRightIcon className="size-4" />
                  </Link>
                ) : (
                  <span className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pr-2.5 pointer-events-none opacity-50")}>
                    <span className="hidden sm:block">{tSearch("next")}</span>
                    <ChevronRightIcon className="size-4" />
                  </span>
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        );
      })()}
    </div>
  );
}
