"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

export default function DashboardCreateBusinessForm() {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tAdmin = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/dashboard/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        router.push("/dashboard/perfil");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || t("save_error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("create_business_title")}
      </h1>

      <div className="bg-card rounded-2xl p-6 border border-border max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>{t("business_name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Mi Negocio S.A."
              className="rounded-xl"
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                {tAdmin("slug")}: {slugify(name)}
              </p>
            )}
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
              {isPending ? t("saving") : t("create_business")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="rounded-full"
            >
              {tAdmin("cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
