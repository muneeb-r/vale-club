"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

interface ReviewSortSelectProps {
  sort: string;
  slug: string;
}

export default function ReviewSortSelect({ sort, slug }: ReviewSortSelectProps) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = [
    { value: "recent", label: t("sort_recent") },
    { value: "highest", label: t("sort_highest") },
    { value: "lowest", label: t("sort_lowest") },
  ];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("rpage");
    router.push(`${pathname}?${params.toString()}#reviews` as "/");
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={sort}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-muted transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}
