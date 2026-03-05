import { useTranslations } from "next-intl";
import BusinessCard from "./BusinessCard";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Business {
  _id: string;
  name: string;
  slug: string;
  gallery?: string[];
  description: string;
  rating: number;
  reviewCount: number;
  location: { city?: string };
  categories: Array<{ name: string; nameEn: string; icon: string }>;
}

interface BusinessGridProps {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
  locale: string;
  searchParams?: Record<string, string>;
}

export default function BusinessGrid({
  businesses,
  total,
  page,
  limit,
  locale,
  searchParams = {},
}: BusinessGridProps) {
  const t = useTranslations("search");
  const totalPages = Math.ceil(total / limit);

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          {t("no_results")}
        </h3>
        <p className="text-muted-foreground">{t("no_results_hint")}</p>
      </div>
    );
  }

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", targetPage.toString());
    return `/search?${params.toString()}` as "/search";
  }

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <BusinessCard key={business._id} business={business} locale={locale} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="pt-4">
          <PaginationContent>
            {/* Previous */}
            <PaginationItem>
              {page > 1 ? (
                <Link
                  href={buildPageUrl(page - 1)}
                  aria-label="Go to previous page"
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pl-2.5")}
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:block">{t("previous")}</span>
                </Link>
              ) : (
                <span className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pl-2.5 pointer-events-none opacity-50")}>
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:block">{t("previous")}</span>
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
                    href={buildPageUrl(entry)}
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
                  href={buildPageUrl(page + 1)}
                  aria-label="Go to next page"
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pr-2.5")}
                >
                  <span className="hidden sm:block">{t("next")}</span>
                  <ChevronRightIcon className="size-4" />
                </Link>
              ) : (
                <span className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pr-2.5 pointer-events-none opacity-50")}>
                  <span className="hidden sm:block">{t("next")}</span>
                  <ChevronRightIcon className="size-4" />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
