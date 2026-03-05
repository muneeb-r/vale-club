"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
  Star,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface Category {
  _id: string;
  name: string;
  nameEn?: string;
  icon?: string;
}

interface PlanOption {
  _id: string;
  name: { es: string; en: string } | string;
  price: number;
}

interface BusinessDetail {
  _id: string;
  name: string;
  slug: string;
  status: "pending" | "inreview" | "active" | "blocked" | "rejected";
  plan: "free" | "paid";
  planId?: {
    _id: string;
    name: { es: string; en: string } | string;
    price: number;
    features: string[];
  } | null;
  featuredUntil?: string;
  description: string;
  prices?: string;
  gallery: string[];
  location: {
    address?: string;
    city?: string;
    country?: string;
  };
  categories: Category[];
  contactWhatsApp?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWeb?: string;
  contactInstagram?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  ownerId: { name: string; email: string } | null;
}

interface BusinessDrawerProps {
  businessId: string | null;
  onClose: () => void;
}

function getPlanName(
  name: { es: string; en: string } | string | undefined,
): string {
  if (!name) return "";
  if (typeof name === "string") return name;
  return name.es || name.en || "";
}

export default function BusinessDrawer({
  businessId,
  onClose,
}: BusinessDrawerProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // Plan editor state
  const [planEditing, setPlanEditing] = useState(false);
  const [planValue, setPlanValue] = useState<"free" | "paid">("free");
  const [featuredUntilValue, setFeaturedUntilValue] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const fetchBusiness = useCallback(async (id: string) => {
    setLoading(true);
    setBusiness(null);
    try {
      const [bizRes, plansRes] = await Promise.all([
        fetch(`/api/admin/businesses/${id}`),
        fetch("/api/admin/plans"),
      ]);
      if (bizRes.ok) {
        const data = await bizRes.json();
        setBusiness(data);
        setPlanValue(data.plan ?? "free");
        setSelectedPlanId(data.planId?._id ?? data.planId ?? "");
        setFeaturedUntilValue(
          data.featuredUntil
            ? new Date(data.featuredUntil).toISOString().slice(0, 10)
            : "",
        );
      }
      if (plansRes.ok) {
        const plans = await plansRes.json();
        setAvailablePlans(plans);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (businessId) {
      setPlanEditing(false);
      setPlanSaved(false);
      fetchBusiness(businessId);
    }
  }, [businessId, fetchBusiness]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function setStatus(status: "active" | "blocked" | "inreview" | "pending" | "rejected") {
    if (!business) return;
    setActionLoading(true);
    await fetch(`/api/admin/businesses/${business._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(false);
    await fetchBusiness(business._id);
    router.refresh();
  }

  async function rejectBusiness() {
    if (!business) return;
    setActionLoading(true);
    await fetch(`/api/admin/businesses/${business._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", adminNote: rejectNote.trim() }),
    });
    setActionLoading(false);
    setRejectOpen(false);
    setRejectNote("");
    await fetchBusiness(business._id);
    router.refresh();
  }

  async function savePlan() {
    if (!business) return;
    setPlanSaving(true);
    await fetch(`/api/admin/businesses/${business._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: planValue,
        planId: planValue === "paid" && selectedPlanId ? selectedPlanId : null,
        featuredUntil:
          planValue === "paid" && featuredUntilValue
            ? featuredUntilValue
            : null,
      }),
    });
    setPlanSaving(false);
    setPlanSaved(true);
    setPlanEditing(false);
    await fetchBusiness(business._id);
    router.refresh();
    setTimeout(() => setPlanSaved(false), 3000);
  }

  async function deleteBusiness() {
    if (!business) return;
    if (!confirm(`${t("confirm_delete")} "${business.name}"?`)) return;
    setActionLoading(true);
    await fetch(`/api/admin/businesses/${business._id}`, { method: "DELETE" });
    setActionLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <Drawer
      open={!!businessId}
      onOpenChange={(open) => { if (!open) onClose(); }}
      direction="right"
    >
      <DrawerContent className="w-full max-w-xl flex flex-col">
        <DrawerHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between gap-4 shrink-0">
          <DrawerTitle className="font-heading text-lg">
            {loading ? "..." : (business?.name ?? "—")}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
              <span className="text-xl leading-none">×</span>
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Loading...
            </div>
          )}

          {!loading && business && (
            <div className="p-6 space-y-6">
              {/* Status + Plan badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={business.status} t={t} />
                <Badge
                  variant={business.plan === "paid" ? "default" : "secondary"}
                  className="border-0"
                >
                  {business.plan === "paid" ? t("pro") : t("free")}
                </Badge>
                {business.rating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    {business.rating.toFixed(1)} ({business.reviewCount})
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {(business.status === "inreview" ||
                  business.status === "pending") && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setStatus("active")}
                      disabled={actionLoading}
                      className="rounded-full bg-primary text-primary-foreground"
                    >
                      {t("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectOpen(true); setRejectNote(""); }}
                      disabled={actionLoading}
                      className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      {t("reject")}
                    </Button>
                  </>
                )}
                {business.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus("blocked")}
                    disabled={actionLoading}
                    className="rounded-full text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    {t("block")}
                  </Button>
                )}
                {business.status === "blocked" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus("active")}
                    disabled={actionLoading}
                    className="rounded-full text-green-600 border-green-300 hover:bg-green-50"
                  >
                    {t("unblock")}
                  </Button>
                )}
                {business.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus("pending")}
                    disabled={actionLoading}
                    className="rounded-full text-muted-foreground border-border hover:bg-muted"
                  >
                    {t("reset_to_pending")}
                  </Button>
                )}
                {business.status === "active" && (
                  <a
                    href={`/empresa/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver perfil
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deleteBusiness}
                  disabled={actionLoading}
                  className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 ml-auto"
                >
                  {t("delete")}
                </Button>
              </div>

              {/* Inline reject form */}
              {rejectOpen && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-destructive">{t("reject_note")}</p>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder={t("reject_note_placeholder")}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={rejectBusiness}
                      disabled={actionLoading}
                      className="rounded-full bg-destructive text-white hover:bg-destructive/90"
                    >
                      {t("reject")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectOpen(false); setRejectNote(""); }}
                      className="rounded-full"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Subscription / Plan ─────────────────────────────── */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("subscription")}
                    </p>
                  </div>
                  {!planEditing && (
                    <button
                      onClick={() => setPlanEditing(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("edit")}
                    </button>
                  )}
                  {planSaved && (
                    <span className="text-xs text-green-600 font-medium">
                      {t("plan_updated")} ✓
                    </span>
                  )}
                </div>

                {!planEditing ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          business.plan === "paid" ? "default" : "secondary"
                        }
                        className="border-0"
                      >
                        {getPlanName(business.planId?.name) ||
                          (business.plan === "paid" ? t("pro") : t("free"))}
                      </Badge>
                      {business.plan === "paid" &&
                        business.planId?.price !== undefined && (
                          <span className="text-muted-foreground text-xs">
                            {business.planId.price} €/mes
                          </span>
                        )}
                      {business.plan === "paid" && business.featuredUntil && (
                        <span className="text-muted-foreground text-xs">
                          · {t("featured_until")}:{" "}
                          {new Date(
                            business.featuredUntil,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Plan selector from catalog */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        {t("assign_plan")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {/* Free option */}
                        <button
                          onClick={() => {
                            setPlanValue("free");
                            setSelectedPlanId("");
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            planValue === "free"
                              ? "bg-background border-primary text-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t("free")} — 0 €
                        </button>
                        {/* Catalog plans */}
                        {availablePlans.map((p) => (
                          <button
                            key={p._id}
                            onClick={() => {
                              setPlanValue("paid");
                              setSelectedPlanId(p._id);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              planValue === "paid" && selectedPlanId === p._id
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {getPlanName(p.name)} — {p.price} €/mes
                          </button>
                        ))}
                        {/* Fallback paid if no plans */}
                        {availablePlans.length === 0 && (
                          <button
                            onClick={() => {
                              setPlanValue("paid");
                              setSelectedPlanId("");
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              planValue === "paid"
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {t("pro")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* featuredUntil date — only for paid */}
                    {planValue === "paid" && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          {t("featured_until")}
                        </label>
                        <Input
                          type="date"
                          value={featuredUntilValue}
                          onChange={(e) =>
                            setFeaturedUntilValue(e.target.value)
                          }
                          className="rounded-lg h-9 text-sm"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={savePlan}
                        disabled={planSaving}
                        className="rounded-full bg-primary text-primary-foreground flex-1"
                      >
                        {planSaving ? "..." : t("save_plan")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPlanEditing(false);
                          setPlanValue(business.plan);
                          setFeaturedUntilValue(
                            business.featuredUntil
                              ? new Date(business.featuredUntil)
                                  .toISOString()
                                  .slice(0, 10)
                              : "",
                          );
                        }}
                        className="rounded-full"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery */}
              {business.gallery?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {business.gallery?.slice(0, 5).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="w-16 h-16 rounded-xl object-cover border border-border"
                      />
                    ))}
                    {business.gallery?.length > 5 && (
                      <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{business.gallery.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {business.description && (
                <Section label="Descripción">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {business.description}
                  </p>
                </Section>
              )}

              {/* Prices */}
              {business.prices && (
                <Section label="Precios">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {business.prices}
                  </p>
                </Section>
              )}

              {/* Categories */}
              {business.categories?.length > 0 && (
                <Section label="Categorías">
                  <div className="flex flex-wrap gap-1.5">
                    {business.categories.map((c) => (
                      <span
                        key={c._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs"
                      >
                        {c.icon && <CategoryIcon icon={c.icon} size="sm" />}
                        {c.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Location */}
              {(business.location?.city || business.location?.address) && (
                <Section label="Ubicación">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>
                      {business.location.address ||
                        [business.location.city, business.location.country]
                          .filter(Boolean)
                          .join(", ")}
                    </span>
                  </div>
                </Section>
              )}

              {/* Contact */}
              <Section label="Contacto">
                <div className="space-y-2">
                  {business.contactWhatsApp && (
                    <ContactRow
                      icon={<MessageCircle className="w-4 h-4" />}
                      value={business.contactWhatsApp}
                    />
                  )}
                  {business.contactPhone && (
                    <ContactRow
                      icon={<Phone className="w-4 h-4" />}
                      value={business.contactPhone}
                    />
                  )}
                  {business.contactEmail && (
                    <ContactRow
                      icon={<Mail className="w-4 h-4" />}
                      value={business.contactEmail}
                    />
                  )}
                  {business.contactWeb && (
                    <ContactRow
                      icon={<Globe className="w-4 h-4" />}
                      value={business.contactWeb}
                      link
                    />
                  )}
                  {business.contactInstagram && (
                    <ContactRow
                      icon={<Instagram className="w-4 h-4" />}
                      value={business.contactInstagram}
                    />
                  )}
                  {!business.contactWhatsApp &&
                    !business.contactPhone &&
                    !business.contactEmail &&
                    !business.contactWeb &&
                    !business.contactInstagram && (
                      <p className="text-sm text-muted-foreground">
                        Sin información de contacto
                      </p>
                    )}
                </div>
              </Section>

              {/* Owner + meta */}
              <Section label="Propietario">
                <div className="space-y-1.5 text-sm">
                  {business.ownerId && (
                    <div className="flex items-center gap-2 text-foreground">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a
                        href={`/admin/usuarios?q=${encodeURIComponent(business.ownerId.email)}&role=business_owner`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {business.ownerId.name} — {business.ownerId.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      Registrado{" "}
                      {new Date(business.createdAt).toLocaleDateString(
                        "es-GT",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}

function ContactRow({
  icon,
  value,
  link,
}: {
  icon: React.ReactNode;
  value: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: BusinessDetail["status"];
  t: (key: string) => string;
}) {
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
