import { Link } from "@/lib/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationBarProps {
  page: number;
  total: number;
  limit: number;
  buildUrl: (page: number) => string;
}

/** Returns an array of page numbers and "…" ellipsis markers to render. */
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

export default async function PaginationBar({
  page,
  total,
  limit,
  buildUrl,
}: PaginationBarProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const range = buildPageRange(page, totalPages);

  return (
    <Pagination className="pt-4">
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1) as "/"}
              aria-label="Go to previous page"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pl-2.5"
              )}
            >
              <ChevronLeftIcon className="size-4" />
              <span className="hidden sm:block">Anterior</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pl-2.5 pointer-events-none opacity-50"
              )}
            >
              <ChevronLeftIcon className="size-4" />
              <span className="hidden sm:block">Anterior</span>
            </span>
          )}
        </PaginationItem>

        {/* Numbered pages */}
        {range.map((entry, i) =>
          entry === "…" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <Link
                href={buildUrl(entry) as "/"}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: entry === page ? "outline" : "ghost",
                    size: "icon",
                  })
                )}
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
              href={buildUrl(page + 1) as "/"}
              aria-label="Go to next page"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pr-2.5"
              )}
            >
              <span className="hidden sm:block">Siguiente</span>
              <ChevronRightIcon className="size-4" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 px-2.5 sm:pr-2.5 pointer-events-none opacity-50"
              )}
            >
              <span className="hidden sm:block">Siguiente</span>
              <ChevronRightIcon className="size-4" />
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
