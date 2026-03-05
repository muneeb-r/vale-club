"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardReviewFilters() {
  const t = useTranslations("reviews");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "0") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Star filter */}
      <Select
        defaultValue={searchParams.get("rating") || "all"}
        onValueChange={(v) => update("rating", v)}
      >
        <SelectTrigger className="w-40 rounded-xl h-9 text-sm">
          <SelectValue placeholder={t("all_ratings")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all_ratings")}</SelectItem>
          {[5, 4, 3, 2, 1].map((s) => (
            <SelectItem key={s} value={String(s)}>
              <span className="flex items-center gap-1.5">
                {s} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        defaultValue={searchParams.get("sort") || "recent"}
        onValueChange={(v) => update("sort", v)}
      >
        <SelectTrigger className="w-44 rounded-xl h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">{t("sort_recent")}</SelectItem>
          <SelectItem value="highest">{t("sort_highest")}</SelectItem>
          <SelectItem value="lowest">{t("sort_lowest")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
