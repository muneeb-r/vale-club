"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ProofFiltersProps {
  status: string;
  q: string;
  user: string;
  rating: string;
  dateFrom: string;
  dateTo: string;
}

export default function ProofFilters({
  status,
  q,
  user,
  rating,
  dateFrom,
  dateTo,
}: ProofFiltersProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();

  const hasFilters = q || user || rating || dateFrom || dateTo;

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("status", status);
      if (q) params.set("q", q);
      if (user) params.set("user", user);
      if (rating) params.set("rating", rating);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      // Apply updates
      for (const [k, v] of Object.entries(updates)) {
        if (v === "") params.delete(k);
        else params.set(k, v);
      }
      // Reset page on filter change
      params.delete("page");
      return `${pathname}?${params.toString()}`;
    },
    [status, q, user, rating, dateFrom, dateTo, pathname]
  );

  function navigate(updates: Record<string, string>) {
    router.push(buildUrl(updates) as "/");
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Business name search */}
      <div className="flex-1 min-w-40">
        <Input
          type="search"
          defaultValue={q}
          placeholder={t("proof_search_business")}
          className="h-8 text-sm rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ q: (e.target as HTMLInputElement).value });
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== q) navigate({ q: e.target.value });
          }}
        />
      </div>

      {/* User / email search */}
      <div className="flex-1 min-w-40">
        <Input
          type="search"
          defaultValue={user}
          placeholder={t("proof_search_user")}
          className="h-8 text-sm rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ user: (e.target as HTMLInputElement).value });
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== user) navigate({ user: e.target.value });
          }}
        />
      </div>

      {/* Rating filter */}
      <div className="shrink-0">
        <select
          value={rating}
          onChange={(e) => navigate({ rating: e.target.value })}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">{t("proof_filter_rating_all")}</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={String(r)}>
              {r} ★
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="shrink-0">
        <Input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => navigate({ dateFrom: e.target.value })}
          className="h-8 text-sm rounded-lg w-36"
          title={t("proof_date_from")}
        />
      </div>

      {/* Date to */}
      <div className="shrink-0">
        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => navigate({ dateTo: e.target.value })}
          className="h-8 text-sm rounded-lg w-36"
          title={t("proof_date_to")}
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() =>
            navigate({ q: "", user: "", rating: "", dateFrom: "", dateTo: "" })
          }
          className="h-8 flex items-center gap-1 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="size-3.5" />
          {t("proof_clear_filters")}
        </button>
      )}
    </div>
  );
}
