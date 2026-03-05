"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface ForgotPasswordFormProps {
  locale: string;
}

export default function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("connection_error"));
        return;
      }

      setSent(true);
    } catch {
      setError(t("connection_error"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("forgot_sent_title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("forgot_sent_description")}
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-primary font-medium hover:underline mt-2"
        >
          ← {t("back_to_login")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
          className="rounded-xl"
        />
      </div>

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
        {loading ? t("forgot_sending") : t("forgot_button")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          ← {t("back_to_login")}
        </Link>
      </p>
    </form>
  );
}
