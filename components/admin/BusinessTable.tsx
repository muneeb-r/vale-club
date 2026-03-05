"use client";

import { useRouter } from "@/lib/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import BusinessDrawer from "./BusinessDrawer";

interface BusinessRow {
  _id: string;
  name: string;
  slug: string;
  status: "pending" | "inreview" | "active" | "blocked" | "rejected";
  plan: string;
  featuredUntil?: string;
  createdAt: string;
  ownerId: { name: string; email: string } | null;
}

interface BusinessTableProps {
  businesses: BusinessRow[];
}

export default function BusinessTable({ businesses }: BusinessTableProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function setStatus(id: string, status: "active" | "inreview" | "blocked" | "pending" | "rejected", adminNote?: string) {
    setLoading(id);
    await fetch(`/api/admin/businesses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(adminNote ? { adminNote } : {}) }),
    });
    setLoading(null);
    router.refresh();
  }

  function rejectWithNote(id: string) {
    const note = window.prompt(t("reject_note_placeholder") || "Motivo del rechazo (opcional)");
    if (note === null) return; // cancelled
    setStatus(id, "rejected", note.trim() || undefined);
  }

  async function deleteBusiness(id: string, name: string) {
    if (!confirm(`${t("confirm_delete")} "${name}"?`)) return;
    setLoading(id);
    await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    setLoading(null);
    router.refresh();
  }

  function StatusBadge({ status }: { status: BusinessRow["status"] }) {
    if (status === "active")
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
          {t("active")}
        </Badge>
      );
    if (status === "blocked")
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">
          {t("blocked")}
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
          {t("rejected")}
        </Badge>
      );
    if (status === "inreview")
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
          {t("inreview")}
        </Badge>
      );
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted border-0">
        {t("pending")}
      </Badge>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center text-muted-foreground">
        {t("no_businesses")}
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t("business")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t("owner")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t("status")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  {t("plan")}
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map((b) => (
                <tr key={b._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedId(b._id)}
                      className="font-medium text-foreground hover:text-primary transition-colors text-left"
                    >
                      {b.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {b.ownerId?.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {(() => {
                      const now = new Date();
                      const until = b.featuredUntil ? new Date(b.featuredUntil) : null;
                      const expired = b.plan === "paid" && until && until < now;
                      const days = until
                        ? Math.ceil((until.getTime() - now.getTime()) / 86400000)
                        : null;
                      const expiringSoon =
                        b.plan === "paid" && days !== null && days >= 0 && days <= 7;
                      return (
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={b.plan === "paid" ? "default" : "secondary"}
                            className="border-0 w-fit"
                          >
                            {b.plan === "paid" ? t("pro") : t("free")}
                          </Badge>
                          {expired && (
                            <span className="text-xs text-red-600 font-medium">
                              {t("expired")}
                            </span>
                          )}
                          {expiringSoon && !expired && (
                            <span className="text-xs text-amber-600 font-medium">
                              {t("expiring_soon")} · {until!.toLocaleDateString()}
                            </span>
                          )}
                          {b.plan === "paid" && until && !expired && !expiringSoon && (
                            <span className="text-xs text-muted-foreground">
                              {until.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedId(b._id)}
                        className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium border border-primary/30 text-primary bg-transparent hover:bg-primary/10 hover:border-primary/60 transition-colors"
                      >
                        {t("view")}
                      </button>
                      {(b.status === "inreview" || b.status === "pending") && (
                        <>
                          <button
                            onClick={() => setStatus(b._id, "active")}
                            disabled={loading === b._id}
                            className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {t("approve")}
                          </button>
                          <button
                            onClick={() => rejectWithNote(b._id)}
                            disabled={loading === b._id}
                            className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium border border-red-200 text-red-600 bg-transparent hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {t("reject")}
                          </button>
                        </>
                      )}
                      {b.status === "active" && (
                        <button
                          onClick={() => setStatus(b._id, "blocked")}
                          disabled={loading === b._id}
                          className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium border border-orange-300 text-orange-600 bg-transparent hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          {t("block")}
                        </button>
                      )}
                      {b.status === "blocked" && (
                        <button
                          onClick={() => setStatus(b._id, "active")}
                          disabled={loading === b._id}
                          className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium border border-green-300 text-green-600 bg-transparent hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {t("unblock")}
                        </button>
                      )}
                      <button
                        onClick={() => deleteBusiness(b._id, b.name)}
                        disabled={loading === b._id}
                        className="inline-flex items-center rounded-full text-xs h-7 px-3 font-medium border border-red-200 text-red-600 bg-transparent hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BusinessDrawer
        businessId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
