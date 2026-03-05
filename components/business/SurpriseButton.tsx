"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Die body */}
      <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
      {/* 5 dots: corners + center */}
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SurpriseButton() {
  const t = useTranslations("search");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSurprise() {
    setLoading(true);
    try {
      let url = "/api/surprise";

      if (navigator.geolocation) {
        const coords = await new Promise<GeolocationCoordinates | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => resolve(null),
            { timeout: 5000, maximumAge: 60_000 },
          );
        });

        if (coords) {
          url += `?lat=${coords.latitude}&lng=${coords.longitude}`;
        }
      }

      const res = await fetch(url);
      if (res.ok) {
        const { slug } = await res.json();
        router.push(`/empresa/${slug}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSurprise}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-60 shrink-0"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <DiceIcon className="w-3.5 h-3.5" />
      )}
      {t("surprise_me")}
    </button>
  );
}
