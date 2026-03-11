"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
  slug: string;
  order: number;
  isActive: boolean;
}

const ICON_EXAMPLES = [
  "mdi:home",
  "mdi:heart-pulse",
  "mdi:spa",
  "mdi:food-fork-drink",
  "mdi:school",
  "mdi:laptop",
  "mdi:car",
  "mdi:paw",
  "mdi:party-popper",
  "mdi:cash",
  "mdi:shopping",
  "mdi:tools",
  "mdi:dumbbell",
  "mdi:brain",
  "mdi:camera",
  "mdi:music",
  "mdi:airplane",
  "mdi:flower",
];

export default function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", nameEn: "", nameCa: "", icon: "mdi:home", order: 0 });
  const [editingIcon, setEditingIcon] = useState<{ id: string; icon: string } | null>(null);

  async function createCategory() {
    if (!newCat.name || !newCat.nameEn) return;
    setLoading("new");
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCat, slug: slugify(newCat.name), isActive: true }),
    });
    setNewCat({ name: "", nameEn: "", nameCa: "", icon: "mdi:home", order: 0 });
    setLoading(null);
    router.refresh();
  }

  async function saveIcon(id: string, icon: string) {
    setLoading(id);
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon }),
    });
    setEditingIcon(null);
    setLoading(null);
    router.refresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm(`${t("confirm_delete")}?`)) return;
    setLoading(id);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setLoading(null);
    router.refresh();
  }

  async function toggleActive(id: string, current: boolean) {
    setLoading(id);
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add new category */}
      <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("new_category")}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>{t("name_es")}</Label>
            <Input value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))} placeholder="Hogar" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{t("name_en")}</Label>
            <Input value={newCat.nameEn} onChange={(e) => setNewCat((p) => ({ ...p, nameEn: e.target.value }))} placeholder="Home" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Nom CA</Label>
            <Input value={newCat.nameCa} onChange={(e) => setNewCat((p) => ({ ...p, nameCa: e.target.value }))} placeholder="Llar" className="rounded-xl" />
          </div>
        </div>

        {/* Icon input */}
        <div className="space-y-2">
          <Label>Icono</Label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 text-foreground">
              <CategoryIcon icon={newCat.icon} size="lg" />
            </div>
            <Input
              value={newCat.icon}
              onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
              placeholder="mdi:home"
              className="rounded-xl font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Usa iconos de{" "}
            <a href="https://icon-sets.iconify.design" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Iconify
            </a>{" "}
            — escribe el nombre, ej: <code className="font-mono bg-muted px-1 rounded">mdi:home</code>, <code className="font-mono bg-muted px-1 rounded">lucide:shopping-cart</code>, <code className="font-mono bg-muted px-1 rounded">ph:heart-bold</code>
          </p>

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 pt-1">
            {ICON_EXAMPLES.map((icon) => (
              <button
                key={icon}
                type="button"
                title={icon}
                onClick={() => setNewCat((p) => ({ ...p, icon }))}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors text-foreground ${
                  newCat.icon === icon ? "border-primary bg-primary/10" : "border-border bg-muted hover:border-primary/50"
                }`}
              >
                <CategoryIcon icon={icon} size="md" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>{t("order")}</Label>
          <Input type="number" value={newCat.order} onChange={(e) => setNewCat((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
        </div>

        <Button onClick={createCategory} disabled={loading === "new" || !newCat.name || !newCat.nameEn} className="rounded-full bg-primary text-primary-foreground">
          {loading === "new" ? t("creating") : t("create_category")}
        </Button>
      </div>

      {/* Categories list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("category")}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("slug")}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("order")}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("status")}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initial.map((cat) => (
              <tr key={cat._id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {editingIcon?.id === cat._id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground">
                        <CategoryIcon icon={editingIcon.icon} size="md" />
                      </div>
                      <Input
                        value={editingIcon.icon}
                        onChange={(e) => setEditingIcon({ id: cat._id, icon: e.target.value })}
                        className="rounded-lg font-mono text-xs h-8 w-40"
                        autoFocus
                      />
                      <button
                        onClick={() => saveIcon(cat._id, editingIcon.icon)}
                        disabled={loading === cat._id}
                        className="text-xs px-3 py-1 rounded-full bg-primary text-white"
                      >
                        {loading === cat._id ? "..." : "Guardar"}
                      </button>
                      <button onClick={() => setEditingIcon(null)} className="text-xs text-muted-foreground">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingIcon({ id: cat._id, icon: cat.icon })}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground hover:bg-muted/70 transition-colors"
                        title="Cambiar icono"
                      >
                        <CategoryIcon icon={cat.icon} size="md" />
                      </button>
                      {cat.name} / {cat.nameEn}{cat.nameCa ? ` / ${cat.nameCa}` : ""}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.order}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(cat._id, cat.isActive)}
                    disabled={loading === cat._id}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      cat.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {cat.isActive ? t("active") : t("inactive")}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat._id)} disabled={loading === cat._id} className="text-destructive hover:bg-destructive/10 rounded-full h-7 w-7 p-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
