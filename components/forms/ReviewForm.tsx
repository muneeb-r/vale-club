"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/business/StarRating";
import ImageUpload from "@/components/forms/ImageUpload";

interface ReviewFormProps {
  businessId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ businessId, onSuccess }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(t("your_rating") + " " + "requerida");
      return;
    }
    if (!proofUrl) {
      setError(t("proof_required") + " requerido");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, text, proofUrl }),
      });

      if (res.ok) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar");
      }
    });
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-green-700 font-semibold text-lg">{t("sent_title")}</p>
        <p className="text-green-600 text-sm">{t("sent_description")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>{t("your_rating")}</Label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="space-y-2">
        <Label>{t("your_review")}</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("review_placeholder")}
          rows={4}
          required
          maxLength={1000}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("proof_required")}</Label>
        <p className="text-xs text-muted-foreground">{t("proof_hint")}</p>
        <ImageUpload
          value={proofUrl}
          onUpload={setProofUrl}
          storagePath="proofs/proof"
          maxSizeMB={10}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary text-primary-foreground"
      >
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
