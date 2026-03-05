"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  icon: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

interface AdminCreateBusinessFormProps {
  categories: Category[];
  users: UserOption[];
}

export default function AdminCreateBusinessForm({
  // categories,
  users,
}: AdminCreateBusinessFormProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ownerId: users[0]?._id || "",
    status: "active" as "inreview" | "active" | "blocked",
    plan: "free" as "free" | "paid",
  });

  function update(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      // auto-generate slug preview
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const slug = slugify(formData.name);
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, slug }),
      });

      if (res.ok) {
        router.push("/admin/empresas");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || t("error_creating"));
      }
    });
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border space-y-5 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>{t("name")}</Label>
          <Input
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
            required
            placeholder={t("business_name_placeholder")}
            className="rounded-xl"
          />
          {formData.name && (
            <p className="text-xs text-muted-foreground">
              {t("slug")}: {slugify(formData.name)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("description")}</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            placeholder={t("business_description_placeholder")}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("owner_label")}</Label>
          <select
            value={formData.ownerId}
            onChange={(e) => update("ownerId", e.target.value)}
            required
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">{t("select_owner")}</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("plan")}</Label>
            <select
              value={formData.plan}
              onChange={(e) =>
                update("plan", e.target.value as "free" | "paid")
              }
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="free">{t("free")}</option>
              <option value="paid">{t("pro")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t("initial_status")}</Label>
            <select
              value={formData.status}
              onChange={(e) =>
                update("status", e.target.value as "inreview" | "active" | "blocked")
              }
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="active">{t("active")}</option>
              <option value="inreview">{t("inreview")}</option>
              <option value="blocked">{t("blocked")}</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary text-primary-foreground"
          >
            {isPending ? t("creating") : t("create_business")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full"
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
