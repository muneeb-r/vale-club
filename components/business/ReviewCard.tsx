"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import StarRating from "@/components/business/StarRating";
import ReviewEditForm from "@/components/business/ReviewEditForm";
import { Link } from "@/lib/navigation";
import { Pencil } from "lucide-react";

interface ReviewCardProps {
  review: {
    _id: string;
    rating: number;
    text: string;
    createdAt: string;
    businessReply?: string;
    userId: { _id: string; name: string; avatar?: string } | null;
  };
  locale: string;
  isOwn: boolean;
}

export default function ReviewCard({ review, locale, isOwn }: ReviewCardProps) {
  const t = useTranslations("reviews");
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {review.userId ? (
              <Link
                href={(`/usuario/${review.userId._id}`) as `/usuario/${string}`}
                className="flex items-center gap-2 group"
              >
                {review.userId.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.userId.avatar}
                    alt={review.userId.name}
                    className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {review.userId.name[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {review.userId.name}
                </p>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  ?
                </div>
                <p className="font-medium text-sm text-foreground">Usuario</p>
              </div>
            )}
          </div>
          {!editing && <StarRating value={review.rating} readonly size="sm" />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString(locale)}
          </span>
          {isOwn && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("edit_review")}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <ReviewEditForm
          reviewId={review._id}
          initialRating={review.rating}
          initialText={review.text}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.text}
        </p>
      )}

      {!editing && review.businessReply && (
        <div className="bg-muted rounded-xl p-4 space-y-1 border-l-2 border-primary">
          <p className="text-xs font-semibold text-primary">{t("business_reply")}</p>
          <p className="text-sm text-muted-foreground">{review.businessReply}</p>
        </div>
      )}
    </div>
  );
}
