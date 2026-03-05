"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/forms/ImageUpload";

interface UserProfileFormProps {
  initialName: string;
  initialAvatar?: string;
}

export default function UserProfileForm({
  initialName,
  initialAvatar,
}: UserProfileFormProps) {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar || "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || t("save_error"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>{t("avatar")}</Label>
        <ImageUpload
          value={avatar}
          onUpload={setAvatar}
          storagePath="avatars/avatar"
          maxSizeMB={5}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("name")}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-xl max-w-sm"
        />
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          {t("saved")}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary text-primary-foreground"
      >
        {isPending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
