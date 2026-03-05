"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const t = useTranslations("contact");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError("");
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setSent(true);
        } else {
          const data = await res.json();
          setError(data.error || t("error"));
        }
      } catch {
        setError(t("error"));
      }
    });
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <h3 className="font-heading font-bold text-lg text-green-800">{t("sent_title")}</h3>
        <p className="text-sm text-green-700">{t("sent_desc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            {t("field_name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={set("name")}
            placeholder={t("field_name_placeholder")}
            required
            className="rounded-xl h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            {t("field_email")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder={t("field_email_placeholder")}
            required
            className="rounded-xl h-11"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-sm font-medium">
          {t("field_subject")}
        </Label>
        <Input
          id="subject"
          value={form.subject}
          onChange={set("subject")}
          placeholder={t("field_subject_placeholder")}
          className="rounded-xl h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-sm font-medium">
          {t("field_message")} <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="message"
          value={form.message}
          onChange={set("message")}
          placeholder={t("field_message_placeholder")}
          required
          rows={6}
          maxLength={2000}
          className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {form.message.length}/2000
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full px-8 h-11 font-semibold"
      >
        <Send className="w-4 h-4 mr-2" />
        {isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
