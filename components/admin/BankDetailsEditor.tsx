"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Landmark } from "lucide-react";

interface BankDetails {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  reference?: string;
  extraInfo?: string;
}

export default function BankDetailsEditor() {
  const t = useTranslations("admin");
  const [details, setDetails] = useState<BankDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => { setDetails(data.bankDetails ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function set(field: keyof BankDetails, value: string) {
    setDetails((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankDetails: details }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-2xl" />;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-primary shrink-0" />
        <h2 className="font-heading font-semibold text-foreground text-sm">{t("bank_details_title")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("bank_details_hint")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(
          [
            ["bankName", t("bank_name")],
            ["accountHolder", t("bank_holder")],
            ["accountNumber", t("bank_account")],
            ["iban", "IBAN"],
            ["swift", "SWIFT / BIC"],
            ["reference", t("bank_reference")],
          ] as [keyof BankDetails, string][]
        ).map(([field, label]) => (
          <div key={field} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              value={details[field] ?? ""}
              onChange={(e) => set(field, e.target.value)}
              className="rounded-xl h-9"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("bank_extra_info")}</Label>
        <textarea
          value={details.extraInfo ?? ""}
          onChange={(e) => set("extraInfo", e.target.value)}
          rows={3}
          placeholder={t("bank_extra_info_placeholder")}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <Button
        size="sm"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-primary text-primary-foreground h-8 px-4"
      >
        {saved ? <><Check className="w-3 h-3 mr-1" />{t("saved")}</> : saving ? t("saving") : t("save_bank_details")}
      </Button>
    </div>
  );
}
