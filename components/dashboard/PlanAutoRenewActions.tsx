"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, BellOff } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  cancelAutoRenew: boolean;
}

export default function PlanAutoRenewActions({ cancelAutoRenew }: Props) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(cancel: boolean) {
    setLoading(true);
    try {
      await fetch("/api/dashboard/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {cancelAutoRenew ? t("plan_autorenew_off_label") : t("plan_autorenew_on_label")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {cancelAutoRenew ? t("plan_autorenew_off_hint") : t("plan_autorenew_on_hint")}
        </p>
      </div>
      {cancelAutoRenew ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs h-8 gap-1.5 shrink-0"
          disabled={loading}
          onClick={() => toggle(false)}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {t("plan_autorenew_enable")}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-xs h-8 gap-1.5 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={loading}
          onClick={() => toggle(true)}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellOff className="w-3 h-3" />}
          {t("plan_autorenew_cancel")}
        </Button>
      )}
    </div>
  );
}
