"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./ImageUpload";
import { AddressAutocomplete, CityAutocomplete, PlaceResult } from "./PlacesAutocomplete";
import { toast } from "sonner";
import { X, CheckCircle2, Circle, ChevronRight, Upload, FileText, Image as ImageIcon } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { catName } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
  parentCategory?: string;
}

interface BusinessData {
  name: string;
  slug: string;
  logo?: string;
  description: string;
  prices?: string;
  pricesType?: "text" | "pdf" | "image";
  pricesFileUrl?: string;
  gallery: string[];
  location: {
    placeName?: string;
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    geoPoint?: { type: "Point"; coordinates: [number, number] };
  };
  contactWhatsApp?: string;
  contactEmail?: string;
  contactWeb?: string;
  contactInstagram?: string;
  contactPhone?: string;
  nrt?: string;
  status: "pending" | "inreview" | "active" | "blocked" | "rejected";
  categories: Category[];
}

interface BusinessProfileFormProps {
  business: BusinessData;
  categories: {
    parents: Category[];
    subcategories: Category[];
  };
  locale: string;
  defaultTab?: "info" | "contact" | "media";
}

// ── Onboarding checklist ─────────────────────────────────────────────────────

interface CheckItem {
  key: string;
  label: string;
  tab: "info" | "contact" | "media";
  done: boolean;
}

function getChecklist(data: BusinessData, t: (k: string) => string): CheckItem[] {
  const hasContact = !!(
    data.contactWhatsApp ||
    data.contactPhone ||
    data.contactEmail ||
    data.contactInstagram ||
    data.contactWeb
  );
  return [
    { key: "description", label: t("checklist_description"), tab: "info", done: data.description.trim().length >= 20 },
    { key: "city", label: t("checklist_location"), tab: "info", done: !!(data.location.city?.trim()) },
    { key: "contact", label: t("checklist_contact"), tab: "contact", done: hasContact },
    { key: "gallery", label: t("checklist_gallery"), tab: "media", done: data.gallery.length >= 1 },
  ];
}

// ── PricesFileUpload ─────────────────────────────────────────────────────────

async function deleteFirebaseUrl(url: string) {
  try {
    // Firebase download URLs encode the path after "/o/" and before "?"
    const match = url.match(/\/o\/(.+?)\?/);
    if (!match) return;
    const path = decodeURIComponent(match[1]);
    await deleteObject(ref(storage, path));
  } catch {
    // file may not exist — ignore
  }
}

function PricesFileUpload({
  slug,
  type,
  currentUrl,
  onUploaded,
  onRemoved,
}: {
  slug: string;
  type: "pdf" | "image";
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];
    const allowedPdf = ["application/pdf"];
    const allowed = type === "pdf" ? allowedPdf : allowedImage;
    if (!allowed.includes(file.type)) return;
    setUploading(true);
    // Delete previous file before uploading new one
    if (currentUrl) await deleteFirebaseUrl(currentUrl);
    const ext = file.name.split(".").pop();
    const path = `businesses/${slug}/prices-${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { console.error(err); setUploading(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onUploaded(url);
        setUploading(false);
        setProgress(0);
      }
    );
  }

  async function handleRemove() {
    if (currentUrl) await deleteFirebaseUrl(currentUrl);
    onRemoved();
  }

  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="flex items-start gap-2">
          {type === "pdf" ? (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <FileText className="w-4 h-4" /> PDF
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="" className="max-h-48 rounded-xl border border-border object-contain" />
          )}
          <button type="button" onClick={handleRemove}
            className="p-1 rounded-full hover:bg-destructive/10 text-destructive shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <label className="cursor-pointer">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
          uploading ? "bg-muted text-muted-foreground" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"
        }`}>
          {type === "pdf" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          <Upload className="w-4 h-4" />
          {uploading ? `${progress}%` : currentUrl ? t("prices_change_file") : type === "pdf" ? t("prices_upload_pdf") : t("prices_upload_image")}
        </div>
        <input
          type="file"
          accept={type === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp"}
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessProfileForm({
  business,
  categories,
  locale,
  defaultTab = "info",
}: BusinessProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("dashboard");
  const [formData, setFormData] = useState({ ...business });
  const [galleryUploading, setGalleryUploading] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "contact" | "media">(defaultTab);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    // Pre-expand parents that have a selected subcategory
    const selected = new Set(
      business.categories.map((c) => (typeof c === "string" ? c : c._id))
    );
    return new Set(
      categories.subcategories
        .filter((s) => s.parentCategory && selected.has(s._id))
        .map((s) => s.parentCategory!)
    );
  });
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [catDropdownOpen]);

  const toggleParent = useCallback((id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function update(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateLocation(field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }

  function updateLocationFromPlace(result: PlaceResult) {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        placeName: result.placeName || prev.location.placeName,
        address: result.address,
        city: result.city || prev.location.city,
        country: result.country || prev.location.country,
        ...(result.lat !== undefined && result.lng !== undefined
          ? {
              coordinates: { lat: result.lat, lng: result.lng },
              geoPoint: { type: "Point" as const, coordinates: [result.lng, result.lat] },
            }
          : {}),
      },
    }));
  }

  async function handleGalleryUpload(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (formData.gallery.length >= 10) {
      toast.error(t("gallery_max"));
      return;
    }

    setGalleryUploading(true);
    const ext = file.name.split(".").pop();
    const path = `businesses/${business.slug}/gallery-${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (err) => {
        console.error(err);
        setGalleryUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        update("gallery", [...formData.gallery, url]);
        setGalleryUploading(false);
      }
    );
  }

  function removeGalleryImage(index: number) {
    update(
      "gallery",
      formData.gallery.filter((_, i) => i !== index)
    );
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) return;
    const updated = [...formData.gallery];
    const [moved] = updated.splice(from, 1);
    updated.splice(targetIndex, 0, moved);
    update("gallery", updated);
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  async function handleSave() {
    // If user switched away from pdf/image type, delete the old file from Firebase
    const origType = business.pricesType ?? "text";
    const newType = formData.pricesType ?? "text";
    if (origType !== newType && (origType === "pdf" || origType === "image") && business.pricesFileUrl) {
      deleteFirebaseUrl(business.pricesFileUrl);
    }

    startTransition(async () => {
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || t("save_error"));
      }
    });
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForReview() {
    setIsSubmitting(true);
    // Save first, then submit
    const saveRes = await fetch(`/api/businesses/${business.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!saveRes.ok) {
      const data = await saveRes.json();
      toast.error(data.error || t("save_error"));
      setIsSubmitting(false);
      return;
    }
    const res = await fetch("/api/dashboard/business/submit", { method: "POST" });
    if (res.ok) {
      toast.success(t("submitted_for_review"));
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || t("save_error"));
    }
    setIsSubmitting(false);
  }

  // Compute checklist from live formData
  const checklist = getChecklist(formData, t);
  const doneCount = checklist.filter((c) => c.done).length;
  const allDone = doneCount === checklist.length;
  const progressPct = Math.round((doneCount / checklist.length) * 100);

  const isPendingFill = formData.status === "pending" || formData.status === "rejected"; // can edit + submit
  const isInReview = formData.status === "inreview";     // submitted, waiting for admin
  const isBlocked = formData.status === "blocked";
  const isRejected = formData.status === "rejected";

  return (
    <div className="space-y-4">
      {/* ── Status banners ── */}
      {isInReview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          {t("pending_approval")}
        </div>
      )}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
          {t("profile_rejected")}
        </div>
      )}
      {isBlocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
          {t("profile_blocked")}
        </div>
      )}

      {/* ── Onboarding checklist (only while filling data) ── */}
      {isPendingFill && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-semibold text-foreground text-sm">
                {t("onboarding_title")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("onboarding_subtitle")}
              </p>
            </div>
            <span className={`text-sm font-bold tabular-nums ${allDone ? "text-green-600" : "text-primary"}`}>
              {doneCount}/{checklist.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Checklist items */}
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {allDone && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {isRejected ? t("onboarding_ready_resubmit") : t("onboarding_ready")}
            </div>
          )}
        </div>
      )}

      {/* ── Main form card ── */}
      <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="rounded-full">
            <TabsTrigger value="info" className="rounded-full">
              {t("tab_info")}
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-full">
              {t("tab_contact")}
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-full">
              {t("tab_media")}
            </TabsTrigger>
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t("business_name")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t("description")}
                {!formData.description.trim() && (
                  <span className="ml-1 text-xs text-destructive">*</span>
                )}
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                placeholder={t("description_placeholder")}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.trim().length}/20 min
              </p>
            </div>
            <div className="space-y-2">
              <Label>NRT <span className="text-destructive">*</span></Label>
              <Input
                value={formData.nrt || ""}
                onChange={(e) => update("nrt", e.target.value)}
                placeholder="U-123456-X"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">{t("nrt_hint")}</p>
            </div>

            {/* Prices — type selector */}
            <div className="space-y-2">
              <Label>{t("prices")}</Label>
              <div className="flex gap-2">
                {(["text", "pdf", "image"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      update("pricesType", type);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      (formData.pricesType ?? "text") === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {type === "text" ? t("prices_type_text") : type === "pdf" ? t("prices_type_pdf") : t("prices_type_image")}
                  </button>
                ))}
              </div>
              {(formData.pricesType ?? "text") === "text" && (
                <Textarea
                  value={formData.prices || ""}
                  onChange={(e) => update("prices", e.target.value)}
                  rows={3}
                  placeholder={t("prices_placeholder")}
                  className="rounded-xl"
                />
              )}
              {((formData.pricesType === "pdf") || (formData.pricesType === "image")) && (
                <PricesFileUpload
                  slug={business.slug}
                  type={formData.pricesType}
                  currentUrl={formData.pricesFileUrl}
                  onUploaded={(url) => update("pricesFileUrl", url)}
                  onRemoved={() => update("pricesFileUrl", "")}
                />
              )}
            </div>

            {/* Categories */}
            {categories.parents.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("categories")}</Label>

                {/* Selected pills — show parent + subcategory pills, group by parent */}
                {(() => {
                  const selectedIds = new Set(
                    formData.categories.map((c) => (typeof c === "string" ? c : c._id))
                  );
                  // Find which parent is active (the one whose subs are selected, or a parentless selection)
                  const activeParent = categories.parents.find((p) =>
                    categories.subcategories.some(
                      (s) => s.parentCategory === p._id && selectedIds.has(s._id)
                    ) || selectedIds.has(p._id)
                  );
                  if (!activeParent) return null;
                  const activeSubs = categories.subcategories.filter(
                    (s) => s.parentCategory === activeParent._id && selectedIds.has(s._id)
                  );
                  return (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {/* Parent pill */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/15 text-primary border border-primary/30 font-medium">
                        <CategoryIcon icon={activeParent.icon} size="sm" />
                        {catName(activeParent, locale)}
                      </span>
                      {activeSubs.map((sub) => (
                        <span
                          key={sub._id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                        >
                          {catName(sub, locale)}
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = formData.categories.filter(
                                (x) => (typeof x === "string" ? x : x._id) !== sub._id
                              );
                              // If no subs remain for this parent, clear parent too
                              const remainingSubs = categories.subcategories.filter(
                                (s) => s.parentCategory === activeParent._id &&
                                  remaining.some((x) => (typeof x === "string" ? x : x._id) === s._id)
                              );
                              if (remainingSubs.length === 0) {
                                update("categories", remaining.filter(
                                  (x) => (typeof x === "string" ? x : x._id) !== activeParent._id
                                ));
                              } else {
                                update("categories", remaining);
                              }
                            }}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {/* Clear all */}
                      <button
                        type="button"
                        onClick={() => update("categories", [])}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}

                {/* Dropdown trigger */}
                <div className="relative" ref={catDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCatDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 h-9 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground">
                      {t("categories_add")}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${catDropdownOpen ? "rotate-90" : ""}`} />
                  </button>

                  {catDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-72 overflow-y-auto">
                      {categories.parents.map((parent) => {
                        const subs = categories.subcategories.filter(
                          (s) => s.parentCategory === parent._id
                        );
                        const isExpanded = expandedParents.has(parent._id);

                        return (
                          <div key={parent._id} className="border-b border-border last:border-0">
                            {/* Parent header row — click to expand */}
                            <button
                              type="button"
                              onClick={() => toggleParent(parent._id)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <CategoryIcon icon={parent.icon} size="sm" className="text-muted-foreground" />
                                {catName(parent, locale)}
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>

                            {/* Subcategory checkboxes */}
                            {isExpanded && (
                              <div className="pb-1">
                                {subs.map((sub) => {
                                  const checked = formData.categories.some(
                                    (c) => (typeof c === "string" ? c : c._id) === sub._id
                                  );
                                  return (
                                    <label
                                      key={sub._id}
                                      className="flex items-center gap-2.5 pl-8 pr-3 py-1.5 text-sm cursor-pointer hover:bg-muted/40 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const currentIds = formData.categories.map(
                                            (c) => (typeof c === "string" ? c : c._id)
                                          );
                                          // Find currently active parent (if any)
                                          const currentParent = categories.parents.find((p) =>
                                            categories.subcategories.some(
                                              (s) => s.parentCategory === p._id && currentIds.includes(s._id)
                                            ) || currentIds.includes(p._id)
                                          );

                                          if (checked) {
                                            // Uncheck: remove sub; if no subs remain for parent, remove parent too
                                            const remaining = formData.categories.filter(
                                              (c) => (typeof c === "string" ? c : c._id) !== sub._id
                                            );
                                            const remainingSubs = categories.subcategories.filter(
                                              (s) => s.parentCategory === parent._id &&
                                                remaining.some((c) => (typeof c === "string" ? c : c._id) === s._id)
                                            );
                                            if (remainingSubs.length === 0) {
                                              update("categories", remaining.filter(
                                                (c) => (typeof c === "string" ? c : c._id) !== parent._id
                                              ));
                                            } else {
                                              update("categories", remaining);
                                            }
                                          } else {
                                            // Check: if switching to a different parent, clear previous parent & its subs
                                            let base = formData.categories;
                                            if (currentParent && currentParent._id !== parent._id) {
                                              const prevSiblingIds = new Set(
                                                categories.subcategories
                                                  .filter((s) => s.parentCategory === currentParent._id)
                                                  .map((s) => s._id)
                                              );
                                              base = base.filter((c) => {
                                                const id = typeof c === "string" ? c : c._id;
                                                return id !== currentParent._id && !prevSiblingIds.has(id);
                                              });
                                            }
                                            // Auto-add parent if not already present
                                            const hasParent = base.some(
                                              (c) => (typeof c === "string" ? c : c._id) === parent._id
                                            );
                                            const next = hasParent ? [...base, sub] : [...base, parent, sub];
                                            update("categories", next);
                                            // Auto-expand this parent
                                            setExpandedParents((prev) => new Set([...prev, parent._id]));
                                          }
                                        }}
                                        className="accent-primary w-3.5 h-3.5 rounded"
                                      />
                                      <span className={checked ? "text-foreground font-medium" : "text-muted-foreground"}>
                                        {catName(sub, locale)}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <AddressAutocomplete
              value={formData.location.address || ""}
              label={t("address")}
              placeholder={t("address_placeholder")}
              onChange={updateLocationFromPlace}
            />
            <CityAutocomplete
              value={formData.location.city || ""}
              label={t("city")}
              placeholder={t("city_placeholder")}
              onChange={(city) => updateLocation("city", city)}
            />
          </TabsContent>

          {/* Contact tab */}
          <TabsContent value="contact" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">{t("contact_hint")}</p>
            {[
              { field: "contactWhatsApp", label: "WhatsApp", placeholder: t("whatsapp_placeholder") },
              { field: "contactPhone", label: t("contact"), placeholder: t("phone_placeholder") },
              { field: "contactEmail", label: "Email", placeholder: t("email_placeholder") },
              { field: "contactInstagram", label: "Instagram", placeholder: t("instagram_placeholder") },
              { field: "contactWeb", label: t("website"), placeholder: t("website_placeholder") },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={(formData as unknown as Record<string, string>)[field] || ""}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={placeholder}
                  className="rounded-xl"
                />
              </div>
            ))}
          </TabsContent>

          {/* Media tab */}
          <TabsContent value="media" className="space-y-6 pt-4">
            {/* Logo */}
            <div className="space-y-3">
              <Label>{t("logo")}</Label>
              <ImageUpload
                value={formData.logo || ""}
                onUpload={(url) => update("logo", url)}
                storagePath={`businesses/${business.slug}/logo`}
              />
            </div>

            <div className="space-y-3">
              <Label>{t("gallery")}</Label>
              <p className="text-xs text-muted-foreground">{t("gallery_hint")}</p>

              {formData.gallery.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {formData.gallery.map((src, index) => (
                    <div
                      key={src}
                      draggable
                      onDragStart={() => { dragIndex.current = index; }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={() => { dragIndex.current = null; setDragOverIndex(null); }}
                      className={`relative group aspect-square cursor-grab active:cursor-grabbing transition-opacity ${
                        dragOverIndex === index ? "opacity-50 ring-2 ring-primary rounded-xl" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-border"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full leading-none">
                          cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.gallery.length < 10 && (
                <label className="cursor-pointer">
                  <div className="w-20 h-20 rounded-xl bg-muted border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors">
                    <span className="text-2xl text-muted-foreground">
                      {galleryUploading ? "⏳" : "+"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={galleryUploading}
                    onChange={(e) =>
                      e.target.files?.[0] && handleGalleryUpload(e.target.files[0])
                    }
                  />
                </label>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            disabled={isPending}
            variant="outline"
            className="rounded-full w-full sm:w-auto"
          >
            {isPending ? t("saving") : t("save")}
          </Button>

          {isPendingFill && (
            <Button
              onClick={handleSubmitForReview}
              disabled={!allDone || isSubmitting}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {isSubmitting ? t("submitting") : isRejected ? t("resubmit_for_review") : t("submit_for_review")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
