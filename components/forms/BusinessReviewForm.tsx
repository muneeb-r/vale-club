"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import StarRating from "@/components/business/StarRating";
import { Button } from "@/components/ui/button";

interface BusinessReviewFormProps {
  userId: string;
  userName: string;
  existing?: { rating: number; text: string };
  onSuccess?: () => void;
}

export default function BusinessReviewForm({
  userId,
  userName,
  existing,
  onSuccess,
}: BusinessReviewFormProps) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const isEdit = !!existing;

  const [editing, setEditing] = useState(!isEdit); // in edit mode immediately if new
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(t("your_rating")); return; }
    if (!text.trim()) { setError(t("your_review")); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/business-reviews", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, rating, text }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al enviar");
      return;
    }
    setSaved(true);
    setEditing(false);
    router.refresh();
    onSuccess?.();
  }

  // Collapsed "already reviewed" state with Edit button
  if (isEdit && !editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
            <p className="text-xs text-muted-foreground">
              {saved ? t("biz_review_updated") : t("biz_review_already")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs rounded-full"
            onClick={() => { setSaved(false); setEditing(true); }}
          >
            {t("edit_review")}
          </Button>
        </div>
        <div className="bg-muted/50 rounded-xl px-3 py-2.5 space-y-1">
          <StarRating value={rating} readonly size="sm" />
          <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground font-medium">
          {isEdit ? t("biz_review_edit") : t("biz_review_write")}:{" "}
          <span className="text-foreground">{userName}</span>
        </p>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs rounded-full"
            onClick={() => setEditing(false)}
          >
            {t("cancel")}
          </Button>

        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t("biz_review_your_rating")}</p>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("biz_review_text_placeholder")}
        maxLength={1000}
        rows={3}
        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="rounded-full text-xs h-8 px-4 bg-primary text-primary-foreground"
        >
          {loading
            ? t("biz_review_submitting")
            : isEdit
            ? t("biz_review_save")
            : t("biz_review_submit")}
        </Button>
      </div>
    </form>
  );
}
