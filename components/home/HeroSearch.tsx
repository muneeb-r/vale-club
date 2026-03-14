"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const t = useTranslations("home");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto px-4 sm:px-0">
      <div className="flex w-full bg-white/10 backdrop-blur-sm border border-white/25 rounded-full p-1.5 gap-2">
        <div className="flex items-center gap-2 flex-1 px-3 min-w-0">
          <Search className="w-4 h-4 text-white/50 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none min-w-0"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-colors shrink-0"
        >
          {t("search_button")}
        </button>
      </div>
    </form>
  );
}
