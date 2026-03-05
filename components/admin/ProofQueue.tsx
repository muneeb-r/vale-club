"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/business/StarRating";

interface ProofReview {
  _id: string;
  rating: number;
  text: string;
  proofUrl: string;
  proofStatus: "pending" | "approved" | "rejected";
  proofNote?: string;
  createdAt: string;
  businessId: { name: string; slug: string } | null;
  userId: { name: string; email: string } | null;
}

interface ProofQueueProps {
  reviews: ProofReview[];
}

export default function ProofQueue({ reviews }: ProofQueueProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(
    id: string,
    action: "approve" | "reject",
    note?: string
  ) {
    setLoadingId(id);
    startTransition(async () => {
      await fetch(`/api/admin/proofs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      setLoadingId(null);
      setRejectingId(null);
      setRejectNote("");
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center text-muted-foreground">
        {t("no_pending_proofs")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review._id}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Proof image */}
            <a
              href={review.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.proofUrl}
                alt="Comprobante"
                className="w-24 h-24 rounded-xl object-cover border border-border hover:opacity-90 transition-opacity"
              />
            </a>

            {/* Details */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-foreground">
                    {review.businessId?.name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.userId?.name} · {review.userId?.email}
                  </p>
                </div>
                <Badge
                  className={
                    review.proofStatus === "pending"
                      ? "bg-yellow-100 text-yellow-700 border-0"
                      : review.proofStatus === "approved"
                      ? "bg-green-100 text-green-700 border-0"
                      : "bg-red-100 text-red-700 border-0"
                  }
                >
                  {review.proofStatus === "pending"
                    ? t("proof_pending")
                    : review.proofStatus === "approved"
                    ? t("proof_approved")
                    : t("proof_rejected")}
                </Badge>
              </div>

              <StarRating value={review.rating} readonly size="sm" />

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {review.text}
              </p>

              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          {review.proofStatus === "pending" && (
            <div className="space-y-3 border-t border-border pt-3">
              {rejectingId === review._id ? (
                <div className="space-y-2">
                  <Textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder={t("reject_note")}
                    rows={2}
                    className="rounded-xl text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAction(review._id, "reject", rejectNote)
                      }
                      disabled={isPending || loadingId === review._id}
                      className="rounded-full bg-destructive text-destructive-foreground text-xs h-7 px-3"
                    >
                      {t("reject_proof")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectNote("");
                      }}
                      className="rounded-full text-xs h-7 px-3"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(review._id, "approve")}
                    disabled={isPending || loadingId === review._id}
                    className="rounded-full bg-primary text-primary-foreground text-xs h-7 px-3"
                  >
                    {t("approve_proof")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectingId(review._id)}
                    disabled={isPending || loadingId === review._id}
                    className="rounded-full text-xs h-7 px-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    {t("reject")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {review.proofNote && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              {t("reject_note")}: {review.proofNote}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
