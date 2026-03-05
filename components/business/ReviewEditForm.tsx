"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import StarRating from "@/components/business/StarRating";

interface ReviewEditFormProps {
  reviewId: string;
  initialRating: number;
  initialText: string;
  onCancel: () => void;
}

export default function ReviewEditForm({
  reviewId,
  initialRating,
  initialText,
  onCancel,
}: ReviewEditFormProps) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("edit_error"));
      } else {
        router.refresh();
        onCancel();
      }
    } catch {
      setError(t("edit_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
      <StarRating value={rating} onChange={setRating} size="sm" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="inline-flex items-center rounded-full text-xs h-7 px-4 font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("save_edit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full text-xs h-7 px-4 font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          {t("cancel_edit")}
        </button>
      </div>
    </form>
  );
}
