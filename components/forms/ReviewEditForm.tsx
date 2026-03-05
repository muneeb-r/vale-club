"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/business/StarRating";
import ImageUpload from "@/components/forms/ImageUpload";
import { Pencil, Trash2, X } from "lucide-react";

interface ReviewEditFormProps {
  reviewId: string;
  initialRating: number;
  initialText: string;
  initialProofUrl: string;
  proofStatus: "pending" | "approved" | "rejected";
  isPublished: boolean;
}

export default function ReviewEditForm({
  reviewId,
  initialRating,
  initialText,
  initialProofUrl,
  proofStatus,
  isPublished,
}: ReviewEditFormProps) {
  const router = useRouter();
  const t = useTranslations("reviews");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [proofUrl, setProofUrl] = useState(initialProofUrl);
  const [error, setError] = useState("");

  // Only allow editing if not published yet (pending/rejected) — or allow re-editing published ones too
  // We allow editing in all states; if proof changes, it resets to pending

  function handleSave() {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, proofUrl }),
      });
      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      }
    });
  }

  async function handleDelete() {
    if (!confirm(t("confirm_delete_review"))) return;
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="w-3 h-3" />
          {t("edit_review")}
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          {t("delete_review")}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-3 mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t("edit_review")}
        </p>
        <button
          onClick={() => {
            setIsOpen(false);
            setRating(initialRating);
            setText(initialText);
            setProofUrl(initialProofUrl);
            setError("");
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(isPublished || proofStatus === "approved") && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {t("edit_review_note")}
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-xs">{t("your_rating")}</Label>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">{t("your_review")}</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1000}
          className="rounded-xl text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">{t("proof_required")}</Label>
        <p className="text-xs text-muted-foreground">{t("proof_hint")}</p>
        <ImageUpload
          value={proofUrl}
          onUpload={setProofUrl}
          storagePath="proofs/proof"
          maxSizeMB={10}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-primary text-primary-foreground h-8 px-4"
        >
          {isPending ? "..." : t("save_review")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          className="rounded-full h-8 px-4"
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
