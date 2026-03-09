"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  CheckCircle2,
  Send,
  Clock,
  XCircle,
  Landmark,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ImageUpload from "@/components/forms/ImageUpload";

interface PlanFeature {
  es: string;
  en: string;
}
interface PlanName {
  es: string;
  en: string;
}

interface Plan {
  _id: string;
  name: PlanName | string;
  price: number;
  priceMonthly?: number;
  priceYearly?: number;
  features: PlanFeature[];
}

interface PendingRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  billingCycle?: "monthly" | "yearly";
  planId: { name: PlanName | string; price: number; priceMonthly?: number; priceYearly?: number } | null;
  createdAt: string;
}

interface BankDetails {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  reference?: string;
  extraInfo?: string;
}

interface Props {
  plans: Plan[];
  pendingRequest: PendingRequest | null;
  locale?: string;
}

function planDisplayName(name: PlanName | string, locale: string): string {
  if (typeof name === "string") return name;
  return locale === "en" ? name.en || name.es : name.es || name.en;
}

function getMonthlyPrice(plan: { price: number; priceMonthly?: number }): number {
  return plan.priceMonthly ?? plan.price ?? 0;
}

function getYearlyPrice(plan: { price: number; priceMonthly?: number; priceYearly?: number }): number {
  return plan.priceYearly ?? (getMonthlyPrice(plan) * 12);
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        title="Copy"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function BankDetailsBox({
  details,
  t,
}: {
  details: BankDetails;
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);

  const fields: [keyof BankDetails, string][] = [
    ["bankName", t("bank_name")],
    ["accountHolder", t("bank_holder")],
    ["accountNumber", t("bank_account")],
    ["iban", "IBAN"],
    ["swift", "SWIFT / BIC"],
    ["reference", t("bank_reference")],
  ];

  const hasFields = fields.some(([k]) => details[k]);
  if (!hasFields && !details.extraInfo) return null;

  return (
    <div className="bg-muted rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {t("bank_details_title")}
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {fields.map(([k, label]) =>
            details[k] ? (
              <CopyField key={k} label={label} value={details[k]!} />
            ) : null,
          )}
          {details.extraInfo && (
            <p className="text-xs text-muted-foreground pt-1">
              {details.extraInfo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionRequestForm({
  plans,
  pendingRequest,
}: Props) {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const paidPlans = plans.filter((p) => (p.priceMonthly ?? p.price) > 0);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    paidPlans[0]?._id ?? "",
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.bankDetails) setBankDetails(data.bankDetails);
      })
      .catch(() => {});
  }, []);

  const selectedPlan = paidPlans.find((p) => p._id === selectedPlanId);

  function handleSubmit() {
    if (!selectedPlanId) return;
    if (!paymentProofUrl) {
      setError(t("payment_proof_required"));
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle,
          paymentNote,
          paymentProofUrl,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || t("submit_error"));
      }
    });
  }

  if (pendingRequest?.status === "pending") {
    const cycle = pendingRequest.billingCycle ?? "monthly";
    const pendingPrice = cycle === "yearly"
      ? getYearlyPrice(pendingRequest.planId ?? { price: 0 })
      : getMonthlyPrice(pendingRequest.planId ?? { price: 0 });
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            {t("request_pending_title")}
          </p>
        </div>
        <p className="text-xs text-amber-700">
          {t("request_pending_desc", {
            plan: pendingRequest.planId
              ? planDisplayName(pendingRequest.planId.name, locale)
              : "—",
            price: pendingPrice,
          })}
          {" "}({cycle === "yearly" ? t("billing_yearly") : t("billing_monthly")})
        </p>
        <p className="text-xs text-amber-600">{t("request_pending_hint")}</p>
      </div>
    );
  }

  if (pendingRequest?.status === "rejected" && !submitted) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {t("request_rejected_title")}
            </p>
          </div>
          {pendingRequest.adminNote && (
            <p className="text-xs text-red-600">{pendingRequest.adminNote}</p>
          )}
          <p className="text-xs text-red-500">{t("request_rejected_hint")}</p>
        </div>
        <RequestForm
          paidPlans={paidPlans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          selectedPlan={selectedPlan}
          paymentNote={paymentNote}
          setPaymentNote={setPaymentNote}
          paymentProofUrl={paymentProofUrl}
          setPaymentProofUrl={setPaymentProofUrl}
          isPending={isPending}
          error={error}
          onSubmit={handleSubmit}
          t={t}
          locale={locale}
          bankDetails={bankDetails}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            {t("request_sent_title")}
          </p>
        </div>
        <p className="text-xs text-green-700">{t("request_sent_desc")}</p>
      </div>
    );
  }

  return (
    <RequestForm
      paidPlans={paidPlans}
      selectedPlanId={selectedPlanId}
      setSelectedPlanId={setSelectedPlanId}
      billingCycle={billingCycle}
      setBillingCycle={setBillingCycle}
      selectedPlan={selectedPlan}
      paymentNote={paymentNote}
      setPaymentNote={setPaymentNote}
      paymentProofUrl={paymentProofUrl}
      setPaymentProofUrl={setPaymentProofUrl}
      isPending={isPending}
      error={error}
      onSubmit={handleSubmit}
      t={t}
      locale={locale}
      bankDetails={bankDetails}
    />
  );
}

function RequestForm({
  paidPlans,
  selectedPlanId,
  setSelectedPlanId,
  billingCycle,
  setBillingCycle,
  selectedPlan,
  paymentNote,
  setPaymentNote,
  paymentProofUrl,
  setPaymentProofUrl,
  isPending,
  error,
  onSubmit,
  t,
  locale,
  bankDetails,
}: {
  paidPlans: Plan[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (c: "monthly" | "yearly") => void;
  selectedPlan: Plan | undefined;
  paymentNote: string;
  setPaymentNote: (v: string) => void;
  paymentProofUrl: string;
  setPaymentProofUrl: (v: string) => void;
  isPending: boolean;
  error: string;
  onSubmit: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
  bankDetails: BankDetails | null;
}) {
  if (paidPlans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("no_paid_plans")}</p>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("request_title")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("request_subtitle")}
        </p>
      </div>

      {/* Plan selector — only if multiple paid plans */}
      {paidPlans.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("select_plan")}
          </label>
          <div className="flex flex-wrap gap-2">
            {paidPlans.map((plan) => (
              <button
                key={plan._id}
                onClick={() => setSelectedPlanId(plan._id)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  selectedPlanId === plan._id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {planDisplayName(plan.name, locale)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("billing_cycle")}
        </label>
        <div className="flex rounded-xl border border-border overflow-hidden w-fit">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {t("billing_monthly")}
            {selectedPlan && (
              <span className="ml-1.5 font-bold">{getMonthlyPrice(selectedPlan)} €</span>
            )}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-l border-border ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {t("billing_yearly")}
            {selectedPlan && (
              <span className="ml-1.5 font-bold">{getYearlyPrice(selectedPlan)} €</span>
            )}
          </button>
        </div>
        {billingCycle === "yearly" && selectedPlan &&
          getYearlyPrice(selectedPlan) < getMonthlyPrice(selectedPlan) * 12 && (
          <p className="text-xs text-green-600 font-medium">
            {t("billing_yearly_savings", {
              amount: (getMonthlyPrice(selectedPlan) * 12 - getYearlyPrice(selectedPlan)).toFixed(0),
            })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("billing_total")}:{" "}
          <span className="font-semibold text-foreground">
            {billingCycle === "yearly"
              ? selectedPlan ? getYearlyPrice(selectedPlan) : 0
              : selectedPlan ? getMonthlyPrice(selectedPlan) : 0} €
          </span>
          {billingCycle === "monthly" ? ` ${t("billing_per_month")}` : ` ${t("billing_per_year")}`}
        </p>
      </div>

      {/* Selected plan features */}
      {selectedPlan && selectedPlan.features.length > 0 && (
        <ul className="space-y-1.5">
          {selectedPlan.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              {locale === "en" ? f.en || f.es : f.es || f.en}
            </li>
          ))}
        </ul>
      )}

      {/* Bank details */}
      {bankDetails && <BankDetailsBox details={bankDetails} t={t} />}

      {/* Payment note */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("payment_note_label")}
        </label>
        <textarea
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder={t("payment_note_placeholder")}
          rows={3}
          maxLength={500}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Transaction proof upload — required */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("payment_proof_label_required")}{" "}
          <span className="text-destructive">*</span>
        </label>
        <ImageUpload
          value={paymentProofUrl}
          onUpload={setPaymentProofUrl}
          storagePath={`subscriptions/${selectedPlanId}`}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={isPending || !selectedPlanId}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {isPending ? t("submitting") : t("submit_request")}
      </button>
    </div>
  );
}
