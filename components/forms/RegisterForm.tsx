"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth");

  const [accountType, setAccountType] = useState<"user" | "business_owner">(
    "user"
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, accountType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("connection_error"));
        return;
      }

      if (accountType === "user") {
        router.push("/perfil");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError(t("connection_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account type selector */}
      <div className="space-y-2">
        <Label>{t("account_type_label")}</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-colors space-y-1",
              accountType === "user"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            <p className="font-medium text-sm text-foreground">
              {t("account_customer")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("account_customer_desc")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business_owner")}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-colors space-y-1",
              accountType === "business_owner"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            <p className="font-medium text-sm text-foreground">
              {t("account_business")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("account_business_desc")}
            </p>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Juan García"
          required
          autoComplete="name"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
          autoComplete="new-password"
          minLength={8}
          className="rounded-xl"
        />
      </div>
      {accountType === "business_owner" && (
        <div className="space-y-2">
          <Label htmlFor="businessName">{t("business_name_optional")}</Label>
          <Input
            id="businessName"
            type="text"
            value={formData.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder="Mi Negocio S.A."
            className="rounded-xl"
          />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {loading ? t("registering") : t("register_button")}
      </Button>
    </form>
  );
}
