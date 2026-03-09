"use client";

import { useState, useTransition, useRef } from "react";
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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  icon: string;
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
  categories: Category[];
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

function PricesFileUpload({
  slug,
  type,
  currentUrl,
  onUploaded,
}: {
  slug: string;
  type: "pdf" | "image";
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];
    const allowedPdf = ["application/pdf"];
    const allowed = type === "pdf" ? allowedPdf : allowedImage;
    if (!allowed.includes(file.type)) return;
    setUploading(true);
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

  return (
    <div className="space-y-2">
      {currentUrl && (
        type === "pdf" ? (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <FileText className="w-4 h-4" /> Ver PDF actual
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Precios" className="max-h-48 rounded-xl border border-border object-contain" />
        )
      )}
      <label className="cursor-pointer">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
          uploading ? "bg-muted text-muted-foreground" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"
        }`}>
          {type === "pdf" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          <Upload className="w-4 h-4" />
          {uploading ? `${progress}%` : currentUrl ? "Cambiar archivo" : `Subir ${type === "pdf" ? "PDF" : "imagen"}`}
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
                    onClick={() => update("pricesType", type)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      (formData.pricesType ?? "text") === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {type === "text" ? t("prices_type_text") : type === "pdf" ? "PDF" : t("prices_type_image")}
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
                />
              )}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>{t("categories")}</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = formData.categories.some(
                      (c) => (typeof c === "string" ? c : c._id) === cat._id
                    );
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            update(
                              "categories",
                              formData.categories.filter(
                                (c) => (typeof c === "string" ? c : c._id) !== cat._id
                              )
                            );
                          } else {
                            update("categories", [...formData.categories, cat]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:border-primary"
                        }`}
                      >
                        <CategoryIcon icon={cat.icon} size="sm" />
                        {locale === "en" ? cat.nameEn : cat.name}
                      </button>
                    );
                  })}
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
