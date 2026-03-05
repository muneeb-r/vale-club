"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

interface ReviewReplyFormProps {
  reviewId: string;
  initialReply?: string;
}

export default function ReviewReplyForm({ reviewId, initialReply }: ReviewReplyFormProps) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState(initialReply || "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const method = initialReply ? "PATCH" : "POST";
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });

      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar");
      }
    });
  }

  // Existing reply — show text + edit button
  if (initialReply && !editing) {
    return (
      <div className="bg-muted rounded-xl p-4 space-y-1 border-l-2 border-primary">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-primary">{t("business_reply")}</p>
          <button
            onClick={() => { setReply(initialReply); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3 h-3" />
            {t("edit_review")}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{initialReply}</p>
      </div>
    );
  }

  // No reply yet — show "Reply" button
  if (!initialReply && !editing) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setEditing(true)}
        className="rounded-full text-xs h-7 px-3"
      >
        {t("reply")}
      </Button>
    );
  }

  // Form (create or edit)
  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder={t("reply_placeholder")}
        rows={3}
        required
        maxLength={1000}
        className="rounded-xl text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="rounded-full bg-primary text-primary-foreground text-xs h-7 px-3"
        >
          {isPending ? t("sending_reply") : t("send_reply")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => { setEditing(false); setReply(initialReply || ""); setError(""); }}
          className="rounded-full text-xs h-7 px-3"
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
