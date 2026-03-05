"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Clock, Building2, CreditCard, FileText, ExternalLink, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SubRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  paymentNote: string;
  paymentProofUrl?: string;
  adminNote: string;
  createdAt: string;
  businessId: { _id: string; name: string; slug: string; plan: string } | null;
  planId: { _id: string; name: { es: string; en: string } | string; price: number; features: { es: string; en: string }[] } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  pending: <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle2 className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
};

export default function SubscriptionQueue({ requests }: { requests: SubRequest[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [featuredUntil, setFeaturedUntil] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function approve(id: string) {
    if (!featuredUntil[id]) {
      setErrors((prev) => ({ ...prev, [id]: t("sub_featured_until_required") }));
      return;
    }
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setLoading(id);
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", featuredUntil: featuredUntil[id] }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((prev) => ({ ...prev, [id]: data.error || "Error al aprobar" }));
      return;
    }
    router.refresh();
  }

  async function reject(id: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", adminNote: rejectNote }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((prev) => ({ ...prev, [id]: data.error || "Error al rechazar" }));
      return;
    }
    setRejectingId(null);
    setRejectNote("");
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
        {t("sub_no_pending")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req._id}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground text-sm">
                  {req.businessId?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {req.planId
                    ? (typeof req.planId.name === "string" ? req.planId.name : req.planId.name.es || req.planId.name.en)
                    : "—"} — {req.planId?.price ?? 0} €/mes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]}`}>
                {STATUS_ICONS[req.status]}
                {t(`sub_${req.status}`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
              {req.businessId?.slug && (
                <a
                  href={`/empresa/${req.businessId.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("view_business")}
                </a>
              )}
            </div>
          </div>

          {/* Plan features */}
          {req.planId?.features && req.planId.features.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {req.planId.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  {f.es}{f.en && f.en !== f.es ? ` / ${f.en}` : ""}
                </li>
              ))}
            </ul>
          )}

          {/* Payment note */}
          {req.paymentNote && (
            <div className="bg-muted rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {t("sub_payment_note")}
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">{req.paymentNote}</p>
            </div>
          )}

          {/* Payment proof image */}
          {req.paymentProofUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                {t("sub_payment_proof")}
              </p>
              <a href={req.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={req.paymentProofUrl}
                  alt="Payment proof"
                  className="max-h-48 rounded-xl border border-border object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          )}

          {/* Admin note (rejection) */}
          {req.status === "rejected" && req.adminNote && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-xs text-red-600">{req.adminNote}</p>
            </div>
          )}

          {/* Actions — only for pending */}
          {req.status === "pending" && (
            <div className="space-y-3 pt-1">
              {/* Featured until date */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0">
                  {t("sub_featured_until")} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={featuredUntil[req._id] ?? ""}
                  onChange={(e) => {
                    setFeaturedUntil((prev) => ({ ...prev, [req._id]: e.target.value }));
                    setErrors((prev) => { const n = { ...prev }; delete n[req._id]; return n; });
                  }}
                  className="h-8 text-sm rounded-lg w-44"
                />
              </div>
              {errors[req._id] && (
                <p className="text-xs text-destructive">{errors[req._id]}</p>
              )}

              {/* Approve / Reject buttons */}
              {rejectingId === req._id ? (
                <div className="space-y-2">
                  <textarea
                    placeholder={t("sub_reject_note")}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    rows={2}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => reject(req._id)}
                      disabled={loading === req._id}
                      className="rounded-full bg-destructive text-destructive-foreground text-xs h-7 px-4"
                    >
                      {t("sub_reject")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setRejectingId(null); setRejectNote(""); }}
                      className="rounded-full text-xs h-7 px-4"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => approve(req._id)}
                    disabled={loading === req._id}
                    className="rounded-full bg-primary text-primary-foreground text-xs h-8 px-4"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {t("sub_approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectingId(req._id)}
                    disabled={loading === req._id}
                    className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-8 px-4"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    {t("sub_reject")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
