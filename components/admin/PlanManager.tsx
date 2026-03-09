"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

interface PlanFeature { es: string; en: string; }
interface PlanName { es: string; en: string; }
interface Plan {
  _id: string;
  name: PlanName;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeature[];
  isActive: boolean;
}

function displayName(name: PlanName | string): string {
  if (typeof name === "string") return name;
  return name.es || name.en || "—";
}

function FeatureEditor({ features, onChange }: { features: PlanFeature[]; onChange: (f: PlanFeature[]) => void }) {
  const [draftEs, setDraftEs] = useState("");
  const [draftEn, setDraftEn] = useState("");
  function add() {
    const es = draftEs.trim(); const en = draftEn.trim();
    if (!es && !en) return;
    onChange([...features, { es, en }]);
    setDraftEs(""); setDraftEn("");
  }
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 text-xs">
            <span className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">ES:</span>{" "}
              <span className="text-muted-foreground">{f.es || "—"}</span>
              <span className="mx-2 text-border">|</span>
              <span className="font-semibold text-foreground">EN:</span>{" "}
              <span className="text-muted-foreground">{f.en || "—"}</span>
            </span>
            <button type="button" onClick={() => onChange(features.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={draftEs} onChange={(e) => setDraftEs(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Característica (ES)" className="rounded-xl text-sm h-8" />
        <Input value={draftEn} onChange={(e) => setDraftEn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Feature (EN)" className="rounded-xl text-sm h-8" />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={add} className="rounded-full h-8 px-3 text-xs">
        <Plus className="w-3 h-3 mr-1" />Add
      </Button>
    </div>
  );
}

function NameEditor({ value, onChange }: { value: PlanName; onChange: (v: PlanName) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Nombre (ES)</Label>
        <Input value={value.es} onChange={(e) => onChange({ ...value, es: e.target.value })}
          placeholder="Pro" className="rounded-xl h-9" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Name (EN)</Label>
        <Input value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder="Pro" className="rounded-xl h-9" />
      </div>
    </div>
  );
}

export default function PlanManager({ plans: initialPlans }: { plans: Plan[] }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState<PlanName>({ es: "", en: "" });
  const [newPriceMonthly, setNewPriceMonthly] = useState("");
  const [newPriceYearly, setNewPriceYearly] = useState("");
  const [newFeatures, setNewFeatures] = useState<PlanFeature[]>([]);
  const [editName, setEditName] = useState<PlanName>({ es: "", en: "" });
  const [editPriceMonthly, setEditPriceMonthly] = useState("");
  const [editPriceYearly, setEditPriceYearly] = useState("");
  const [editFeatures, setEditFeatures] = useState<PlanFeature[]>([]);
  const [editActive, setEditActive] = useState(true);

  function startEdit(plan: Plan) {
    setEditingId(plan._id);
    const n = typeof plan.name === "string"
      ? { es: plan.name as unknown as string, en: "" }
      : { es: plan.name.es ?? "", en: plan.name.en ?? "" };
    setEditName(n);
    setEditPriceMonthly((plan.priceMonthly ?? plan.price ?? 0).toString());
    setEditPriceYearly((plan.priceYearly ?? 0).toString());
    setEditFeatures([...plan.features]);
    setEditActive(plan.isActive);
  }

  async function saveEdit(id: string) {
    setLoading(id);
    const priceMonthly = parseFloat(editPriceMonthly) || 0;
    const priceYearly = parseFloat(editPriceYearly) || 0;
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: priceMonthly, priceMonthly, priceYearly, features: editFeatures, isActive: editActive }),
    });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => (p._id === id
        ? { ...p, name: editName, price: priceMonthly, priceMonthly, priceYearly, features: editFeatures, isActive: editActive }
        : p)));
      setEditingId(null);
    }
    setLoading(null);
  }

  async function deletePlan(id: string, name: PlanName) {
    if (!confirm(`${t("confirm_delete_plan")} "${displayName(name)}"?`)) return;
    setLoading(id);
    await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p._id !== id));
    setLoading(null);
    router.refresh();
  }

  async function createPlan() {
    if (!newName.es.trim() && !newName.en.trim()) return;
    setLoading("new");
    const priceMonthly = parseFloat(newPriceMonthly) || 0;
    const priceYearly = parseFloat(newPriceYearly) || 0;
    const res = await fetch("/api/admin/plans", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, price: priceMonthly, priceMonthly, priceYearly, features: newFeatures }),
    });
    if (res.ok) {
      const created = await res.json();
      setPlans((prev) => [...prev, created]);
      setNewName({ es: "", en: "" }); setNewPriceMonthly(""); setNewPriceYearly(""); setNewFeatures([]); setCreating(false);
    }
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      {plans.length === 0 && !creating && (
        <div className="bg-card rounded-2xl p-8 border border-border text-center text-muted-foreground text-sm">
          {t("no_plans")}
        </div>
      )}
      {plans.map((plan) =>
        editingId === plan._id ? (
          <div key={plan._id} className="bg-card border border-primary rounded-2xl p-5 space-y-4">
            <div className="space-y-1"><Label className="text-xs">{t("plan_name")}</Label>
              <NameEditor value={editName} onChange={setEditName} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("plan_price_month")} (€/mes)</Label>
                <Input type="number" min={0} step={0.01} value={editPriceMonthly}
                  onChange={(e) => setEditPriceMonthly(e.target.value)}
                  placeholder="20" className="rounded-xl h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("plan_price_year")} (€/año)</Label>
                <Input type="number" min={0} step={0.01} value={editPriceYearly}
                  onChange={(e) => setEditPriceYearly(e.target.value)}
                  placeholder="200" className="rounded-xl h-9" />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">{t("plan_features")}</Label>
              <FeatureEditor features={editFeatures} onChange={setEditFeatures} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`active-${plan._id}`} checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)} className="rounded" />
              <Label htmlFor={`active-${plan._id}`} className="text-xs cursor-pointer">{t("plan_active")}</Label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveEdit(plan._id)} disabled={loading === plan._id}
                className="rounded-full bg-primary text-primary-foreground h-8 px-4">
                <Check className="w-3 h-3 mr-1" />{t("save_plan")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="rounded-full h-8 px-4">
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div key={plan._id}
            className={`bg-card border rounded-2xl p-5 space-y-3 ${plan.isActive ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-semibold text-foreground">
                    {displayName(plan.name)}
                    {typeof plan.name === "object" && plan.name.en && plan.name.en !== plan.name.es && (
                      <span className="text-muted-foreground font-normal text-sm ml-1">/ {plan.name.en}</span>
                    )}
                  </h3>
                  {!plan.isActive && <Badge variant="secondary" className="border-0 text-xs">{t("plan_inactive")}</Badge>}
                </div>
                <div className="flex items-baseline gap-4 mt-1 flex-wrap">
                  <p className="text-xl font-bold text-primary">
                    {(plan.priceMonthly ?? plan.price) === 0 ? "Gratis / Free" : `${plan.priceMonthly ?? plan.price} €`}
                    {(plan.priceMonthly ?? plan.price) > 0 && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
                  </p>
                  {(plan.priceYearly ?? 0) > 0 && (
                    <p className="text-lg font-semibold text-foreground/70">
                      {plan.priceYearly} €<span className="text-sm font-normal text-muted-foreground">/año</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => startEdit(plan)} className="rounded-full h-8 w-8 p-0">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deletePlan(plan._id, plan.name)}
                  disabled={loading === plan._id}
                  className="rounded-full h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {plan.features.length > 0 && (
              <ul className="space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span><span className="font-medium text-foreground/70">ES:</span> {f.es || "—"}{" · "}<span className="font-medium text-foreground/70">EN:</span> {f.en || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}
      {creating ? (
        <div className="bg-card border border-primary rounded-2xl p-5 space-y-4">
          <p className="font-heading font-semibold text-sm text-foreground">{t("new_plan")}</p>
          <div className="space-y-1"><Label className="text-xs">{t("plan_name")}</Label>
            <NameEditor value={newName} onChange={setNewName} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("plan_price_month")} (€/mes)</Label>
              <Input type="number" min={0} step={0.01} value={newPriceMonthly}
                onChange={(e) => setNewPriceMonthly(e.target.value)} placeholder="20" className="rounded-xl h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("plan_price_year")} (€/año)</Label>
              <Input type="number" min={0} step={0.01} value={newPriceYearly}
                onChange={(e) => setNewPriceYearly(e.target.value)} placeholder="200" className="rounded-xl h-9" />
            </div>
          </div>
          <div className="space-y-1"><Label className="text-xs">{t("plan_features")}</Label>
            <FeatureEditor features={newFeatures} onChange={setNewFeatures} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createPlan}
              disabled={loading === "new" || (!newName.es.trim() && !newName.en.trim())}
              className="rounded-full bg-primary text-primary-foreground h-8 px-4">
              {loading === "new" ? t("creating") : t("create_plan")}
            </Button>
            <Button size="sm" variant="ghost"
              onClick={() => { setCreating(false); setNewName({ es: "", en: "" }); setNewPriceMonthly(""); setNewPriceYearly(""); setNewFeatures([]); }}
              className="rounded-full h-8 px-4">{t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setCreating(true)}
          className="rounded-full border-dashed w-full h-10 text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4 mr-2" />{t("new_plan")}
        </Button>
      )}
    </div>
  );
}
