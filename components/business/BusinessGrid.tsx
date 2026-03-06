import { useTranslations } from "next-intl";
import BusinessCard from "./BusinessCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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
              <PaginationLink
                size="default"
                href={buildPageUrl(Math.max(1, page - 1))}
                aria-label={t("previous")}
                aria-disabled={page <= 1}
                className={`gap-1 px-2.5 sm:pl-2.5${page <= 1 ? " pointer-events-none opacity-50" : ""}`}
              >
                <ChevronLeftIcon className="size-4" />
                <span className="hidden sm:block">{t("previous")}</span>
              </PaginationLink>
            </PaginationItem>

            {/* Page numbers */}
            {buildPageRange(page, totalPages).map((entry, i) =>
              entry === "…" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry}>
                  <PaginationLink href={buildPageUrl(entry)} isActive={entry === page}>
                    {entry}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* Next */}
            <PaginationItem>
              <PaginationLink
                size="default"
                href={buildPageUrl(Math.min(totalPages, page + 1))}
                aria-label={t("next")}
                aria-disabled={page >= totalPages}
                className={`gap-1 px-2.5 sm:pr-2.5${page >= totalPages ? " pointer-events-none opacity-50" : ""}`}
              >
                <span className="hidden sm:block">{t("next")}</span>
                <ChevronRightIcon className="size-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
