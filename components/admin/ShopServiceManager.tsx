"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

type PriceType = "fixed" | "quote";
type OrderStatus = "new" | "in_progress" | "done" | "cancelled";

interface ShopCategory {
  _id: string;
  slug: string;
  name: { es: string; en: string; ca: string };
  icon?: string;
  order: number;
  isActive: boolean;
}

interface ShopService {
  _id: string;
  category: ShopCategory;
  name: { es: string; en: string; ca: string };
  description?: { es: string; en: string; ca: string };
  price?: number;
  promoPrice?: number;
  priceType: PriceType;
  order: number;
  isActive: boolean;
}

interface ShopOrder {
  _id: string;
  serviceId: { _id: string; name: { es: string; en: string; ca: string }; priceType: string; price?: number } | null;
  type: "purchase" | "quote";
  name: string;
  email: string;
  message: string;
  status: OrderStatus;
  adminNote: string;
  createdAt: string;
}

const EMPTY_SERVICE = {
  categoryId: "",
  name: { es: "", en: "", ca: "" },
  description: { es: "", en: "", ca: "" },
  price: undefined as number | undefined,
  promoPrice: undefined as number | undefined,
  priceType: "fixed" as PriceType,
  order: 0,
  isActive: true,
};

const EMPTY_CATEGORY = {
  slug: "",
  name: { es: "", en: "", ca: "" },
  icon: "mdi:star-circle",
  order: 0,
  isActive: true,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function ShopServiceManager({
  categories: initialCats,
  services: initialServices,
}: {
  categories: ShopCategory[];
  services: ShopService[];
}) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"services" | "orders">("services");

  const STATUS_LABELS: Record<OrderStatus, string> = {
    new: t("shop_order_status_new"),
    in_progress: t("shop_order_status_in_progress"),
    done: t("shop_order_status_done"),
    cancelled: t("shop_order_status_cancelled"),
  };

  const [categories, setCategories] = useState(initialCats);
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState<string | null>(null);

  // Service state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<Partial<ShopService & { categoryId: string }>>({});
  const [showNewService, setShowNewService] = useState(false);
  const [newService, setNewService] = useState({ ...EMPTY_SERVICE, categoryId: initialCats[0]?._id ?? "" });

  // Category state
  const [showCats, setShowCats] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState<Partial<ShopCategory>>({});
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCat, setNewCat] = useState(EMPTY_CATEGORY);

  // Orders state
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/admin/shop-orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "orders" && orders.length === 0) fetchOrders();
  }, [tab, orders.length, fetchOrders]);

  // ── Categories CRUD ────────────────────────────────────────────────────────

  async function createCategory() {
    if (!newCat.name.es || !newCat.name.en) return;
    setLoading("new-cat");
    const res = await fetch("/api/admin/shop-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((p) => [...p, data]);
      setNewCat(EMPTY_CATEGORY);
      setShowNewCat(false);
    }
    setLoading(null);
  }

  async function saveCat(id: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/shop-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editCatForm),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((p) => p.map((c) => (c._id === id ? data : c)));
      setEditingCatId(null);
    }
    setLoading(null);
  }

  async function deleteCat(id: string) {
    if (!confirm(t("shop_confirm_delete_category"))) return;
    setLoading(id);
    await fetch(`/api/admin/shop-categories/${id}`, { method: "DELETE" });
    setCategories((p) => p.filter((c) => c._id !== id));
    setLoading(null);
  }

  async function toggleCat(c: ShopCategory) {
    setLoading(c._id);
    const res = await fetch(`/api/admin/shop-categories/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((p) => p.map((x) => (x._id === c._id ? data : x)));
    }
    setLoading(null);
  }

  // ── Services CRUD ──────────────────────────────────────────────────────────

  async function createService() {
    if (!newService.name.es || !newService.name.en || !newService.categoryId) return;
    setLoading("new-svc");
    const body = { ...newService, category: newService.categoryId };
    const res = await fetch("/api/admin/shop-services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewService({ ...EMPTY_SERVICE, categoryId: categories[0]?._id ?? "" });
      setShowNewService(false);
      router.refresh();
    }
    setLoading(null);
  }

  async function saveService(id: string) {
    setLoading(id);
    const body = { ...editServiceForm, category: editServiceForm.categoryId };
    const res = await fetch(`/api/admin/shop-services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.refresh();
      setEditingServiceId(null);
    }
    setLoading(null);
  }

  async function deleteService(id: string) {
    if (!confirm(t("shop_confirm_delete_service"))) return;
    setLoading(id);
    await fetch(`/api/admin/shop-services/${id}`, { method: "DELETE" });
    setServices((p) => p.filter((s) => s._id !== id));
    setLoading(null);
  }

  async function toggleService(s: ShopService) {
    setLoading(s._id);
    const res = await fetch(`/api/admin/shop-services/${s._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setServices((p) => p.map((x) => (x._id === s._id ? { ...x, isActive: data.isActive } : x)));
    }
    setLoading(null);
  }

  function startEditService(s: ShopService) {
    setEditingServiceId(s._id);
    setEditServiceForm({ ...s, categoryId: s.category._id });
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  function openOrderDrawer(order: ShopOrder) {
    setSelectedOrder(order);
    setOrderNote(order.adminNote ?? "");
    setDrawerOpen(true);
  }

  async function updateOrder(id: string, patch: Partial<Pick<ShopOrder, "status" | "adminNote">>) {
    setSavingOrder(true);
    const res = await fetch(`/api/admin/shop-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((p) => p.map((o) => (o._id === id ? { ...o, ...updated } : o)));
      setSelectedOrder((prev) => (prev?._id === id ? { ...prev, ...updated } : prev));
    }
    setSavingOrder(false);
  }

  async function deleteOrder(id: string) {
    if (!confirm(t("shop_confirm_delete_order"))) return;
    await fetch(`/api/admin/shop-orders/${id}`, { method: "DELETE" });
    setOrders((p) => p.filter((o) => o._id !== id));
    setDrawerOpen(false);
  }

  // Group services by category, in DB order
  const servicesByCategory = services.reduce<Record<string, ShopService[]>>((acc, s) => {
    const id = s.category?._id ?? "unknown";
    if (!acc[id]) acc[id] = [];
    acc[id].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("services")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "services" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {t("shop_services_tab")}
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {t("shop_orders_tab")}
          {orders.filter((o) => o.status === "new").length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center leading-none">
              {orders.filter((o) => o.status === "new").length}
            </span>
          )}
        </button>
      </div>

      {tab === "services" && (
        <div className="space-y-8">

          {/* ── Categories section ─────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowCats((p) => !p)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <span>{t("shop_categories_label")} ({categories.length})</span>
              {showCats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCats && (
              <div className="border-t border-border p-4 space-y-4">
                {showNewCat ? (
                  <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_name_es")}</Label><Input value={newCat.name.es} onChange={(e) => setNewCat((p) => ({ ...p, name: { ...p.name, es: e.target.value } }))} className="rounded-xl text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_name_en")}</Label><Input value={newCat.name.en} onChange={(e) => setNewCat((p) => ({ ...p, name: { ...p.name, en: e.target.value } }))} className="rounded-xl text-xs" /></div>
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_name_ca")}</Label><Input value={newCat.name.ca} onChange={(e) => setNewCat((p) => ({ ...p, name: { ...p.name, ca: e.target.value } }))} className="rounded-xl text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_slug")}</Label><Input value={newCat.slug} onChange={(e) => setNewCat((p) => ({ ...p, slug: e.target.value }))} className="rounded-xl text-xs font-mono" /></div>
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_icon")}</Label><Input value={newCat.icon} onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))} className="rounded-xl text-xs font-mono" /></div>
                      <div className="space-y-1"><Label className="text-xs">{t("shop_cat_order")}</Label><Input type="number" value={newCat.order} onChange={(e) => setNewCat((p) => ({ ...p, order: Number(e.target.value) }))} className="rounded-xl text-xs" /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={createCategory} disabled={loading === "new-cat" || !newCat.name.es || !newCat.name.en} className="rounded-full">{loading === "new-cat" ? t("shop_creating") : t("create_category")}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowNewCat(false)} className="rounded-full">{t("cancel")}</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowNewCat(true)} className="rounded-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> {t("shop_new_category")}
                  </Button>
                )}

                <table className="w-full text-sm">
                  <thead className="bg-muted/60 border-y border-border">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("shop_col_name")}</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">{t("shop_cat_slug")}</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("shop_col_order")}</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("shop_col_status")}</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t("shop_col_actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-muted/20">
                        {editingCatId === cat._id ? (
                          <td colSpan={5} className="px-3 py-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              <Input placeholder="ES" value={editCatForm.name?.es ?? ""} onChange={(e) => setEditCatForm((p) => ({ ...p, name: { ...(p.name ?? cat.name), es: e.target.value } }))} className="rounded-xl text-xs w-28" />
                              <Input placeholder="EN" value={editCatForm.name?.en ?? ""} onChange={(e) => setEditCatForm((p) => ({ ...p, name: { ...(p.name ?? cat.name), en: e.target.value } }))} className="rounded-xl text-xs w-28" />
                              <Input placeholder="CA" value={editCatForm.name?.ca ?? ""} onChange={(e) => setEditCatForm((p) => ({ ...p, name: { ...(p.name ?? cat.name), ca: e.target.value } }))} className="rounded-xl text-xs w-28" />
                              <Input placeholder="mdi:icon" value={editCatForm.icon ?? ""} onChange={(e) => setEditCatForm((p) => ({ ...p, icon: e.target.value }))} className="rounded-xl text-xs font-mono w-32" />
                              <Input type="number" placeholder="Orden" value={editCatForm.order ?? 0} onChange={(e) => setEditCatForm((p) => ({ ...p, order: Number(e.target.value) }))} className="rounded-xl text-xs w-20" />
                              <button onClick={() => saveCat(cat._id)} disabled={loading === cat._id} className="p-1.5 rounded-full bg-primary text-white"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingCatId(null)} className="p-1.5 rounded-full border border-border"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-medium text-foreground">{cat.name.es}</td>
                            <td className="px-3 py-2 text-muted-foreground font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                            <td className="px-3 py-2 text-muted-foreground">{cat.order}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => toggleCat(cat)} disabled={loading === cat._id}
                                className={`text-xs px-3 py-1 rounded-full border transition-colors ${cat.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                                {cat.isActive ? t("shop_cat_active") : t("shop_cat_inactive")}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-right flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setEditingCatId(cat._id); setEditCatForm({ ...cat }); }} className="rounded-full h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteCat(cat._id)} disabled={loading === cat._id} className="text-destructive hover:bg-destructive/10 rounded-full h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── New service form ─────────────────────────────────────────────── */}
          {showNewService ? (
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> {t("shop_new_service")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t("shop_svc_category")}</Label>
                  <select value={newService.categoryId} onChange={(e) => setNewService((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name.es}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t("shop_svc_price_type")}</Label>
                  <select value={newService.priceType} onChange={(e) => setNewService((p) => ({ ...p, priceType: e.target.value as PriceType }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                    <option value="fixed">{t("shop_svc_price_fixed")}</option>
                    <option value="quote">{t("shop_svc_price_quote")}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>{t("shop_svc_name_es")}</Label><Input value={newService.name.es} onChange={(e) => setNewService((p) => ({ ...p, name: { ...p.name, es: e.target.value } }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>{t("shop_svc_name_en")}</Label><Input value={newService.name.en} onChange={(e) => setNewService((p) => ({ ...p, name: { ...p.name, en: e.target.value } }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>{t("shop_svc_name_ca")}</Label><Input value={newService.name.ca} onChange={(e) => setNewService((p) => ({ ...p, name: { ...p.name, ca: e.target.value } }))} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>{t("shop_svc_desc_es")}</Label><Input value={newService.description?.es ?? ""} onChange={(e) => setNewService((p) => ({ ...p, description: { ...p.description!, es: e.target.value } }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>{t("shop_svc_desc_en")}</Label><Input value={newService.description?.en ?? ""} onChange={(e) => setNewService((p) => ({ ...p, description: { ...p.description!, en: e.target.value } }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>{t("shop_svc_desc_ca")}</Label><Input value={newService.description?.ca ?? ""} onChange={(e) => setNewService((p) => ({ ...p, description: { ...p.description!, ca: e.target.value } }))} className="rounded-xl" /></div>
              </div>
              {newService.priceType === "fixed" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>{t("shop_svc_price")}</Label><Input type="number" value={newService.price ?? ""} onChange={(e) => setNewService((p) => ({ ...p, price: Number(e.target.value) || undefined }))} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label>{t("shop_svc_promo_price")}</Label><Input type="number" value={newService.promoPrice ?? ""} onChange={(e) => setNewService((p) => ({ ...p, promoPrice: Number(e.target.value) || undefined }))} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label>{t("shop_svc_order")}</Label><Input type="number" value={newService.order} onChange={(e) => setNewService((p) => ({ ...p, order: Number(e.target.value) || 0 }))} className="rounded-xl" /></div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={createService} disabled={loading === "new-svc" || !newService.name.es || !newService.name.en} className="rounded-full">{loading === "new-svc" ? t("shop_saving") : t("create_category")}</Button>
                <Button variant="ghost" onClick={() => setShowNewService(false)} className="rounded-full">{t("cancel")}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowNewService(true)} className="rounded-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> {t("shop_new_service")}
            </Button>
          )}

          {/* ── Services grouped by category ─────────────────────────────────── */}
          {categories.map((cat) => {
            const catServices = servicesByCategory[cat._id];
            if (!catServices?.length) return null;
            return (
              <div key={cat._id} className="space-y-3">
                <h2 className="font-heading font-semibold text-foreground">{cat.name.es}</h2>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t("shop_col_name")}</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">{t("shop_col_price")}</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">{t("shop_col_order")}</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t("shop_col_status")}</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t("shop_col_actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {catServices.map((s) => (
                        <tr key={s._id} className="hover:bg-muted/30">
                          {editingServiceId === s._id ? (
                            <td colSpan={5} className="px-4 py-3">
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  <Input placeholder="ES" value={(editServiceForm.name as { es: string })?.es ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, name: { ...(p.name as object), es: e.target.value } as { es: string; en: string; ca: string } }))} className="rounded-xl text-xs" />
                                  <Input placeholder="EN" value={(editServiceForm.name as { en: string })?.en ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, name: { ...(p.name as object), en: e.target.value } as { es: string; en: string; ca: string } }))} className="rounded-xl text-xs" />
                                  <Input placeholder="CA" value={(editServiceForm.name as { ca: string })?.ca ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, name: { ...(p.name as object), ca: e.target.value } as { es: string; en: string; ca: string } }))} className="rounded-xl text-xs" />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <select value={editServiceForm.categoryId ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, categoryId: e.target.value }))}
                                    className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs">
                                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name.es}</option>)}
                                  </select>
                                  <select value={(editServiceForm.priceType as string) ?? "fixed"} onChange={(e) => setEditServiceForm((p) => ({ ...p, priceType: e.target.value as PriceType }))}
                                    className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs">
                                    <option value="fixed">{t("shop_svc_price_fixed")}</option>
                                    <option value="quote">{t("shop_svc_price_quote")}</option>
                                  </select>
                                  {editServiceForm.priceType === "fixed" && (
                                    <>
                                      <Input type="number" placeholder="Precio €" value={editServiceForm.price ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, price: Number(e.target.value) || undefined }))} className="rounded-xl text-xs w-28" />
                                      <Input type="number" placeholder="Promo €" value={editServiceForm.promoPrice ?? ""} onChange={(e) => setEditServiceForm((p) => ({ ...p, promoPrice: Number(e.target.value) || undefined }))} className="rounded-xl text-xs w-28" />
                                    </>
                                  )}
                                  <Input type="number" placeholder="Orden" value={editServiceForm.order ?? 0} onChange={(e) => setEditServiceForm((p) => ({ ...p, order: Number(e.target.value) }))} className="rounded-xl text-xs w-20" />
                                  <button onClick={() => saveService(s._id)} disabled={loading === s._id} className="p-1.5 rounded-full bg-primary text-white"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingServiceId(null)} className="p-1.5 rounded-full border border-border"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-medium text-foreground">{s.name.es}</td>
                              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                {s.priceType === "quote" ? t("shop_svc_quote_label") : `${s.price} €${s.promoPrice ? ` (promo: ${s.promoPrice} €)` : ""}`}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.order}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => toggleService(s)} disabled={loading === s._id}
                                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${s.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                                  {s.isActive ? t("shop_svc_active") : t("shop_svc_inactive")}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => startEditService(s)} className="rounded-full h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteService(s._id)} disabled={loading === s._id} className="text-destructive hover:bg-destructive/10 rounded-full h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {orders.length === 1 ? t("shop_orders_total_one") : t("shop_orders_total_other", { count: orders.length })}
            </p>
            <Button size="sm" variant="outline" onClick={fetchOrders} disabled={ordersLoading} className="rounded-full text-xs">
              {ordersLoading ? t("shop_orders_loading") : t("shop_orders_refresh")}
            </Button>
          </div>

          {ordersLoading && orders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{t("shop_orders_loading")}</p>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t("shop_orders_empty")}</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t("shop_col_client")}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">{t("shop_col_service")}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t("shop_col_type")}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t("shop_col_status")}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">{t("shop_col_date")}</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">{t("shop_col_detail")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openOrderDrawer(order)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{order.name}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {order.serviceId ? order.serviceId.name.es : <span className="text-xs italic">{t("shop_service_deleted")}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${order.type === "quote" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                          {order.type === "quote" ? t("shop_order_type_quote") : t("shop_order_type_purchase")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" className="rounded-full h-7 w-7 p-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Order detail drawer ──────────────────────────────────────────────── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="max-w-md w-full overflow-y-auto">
          {selectedOrder && (
            <>
              <DrawerHeader className="border-b border-border pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <DrawerTitle className="font-heading">
                      {t("shop_order_title", { name: selectedOrder.name })}
                    </DrawerTitle>
                    <DrawerDescription className="mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </DrawerDescription>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 -mt-1">
                      <X className="w-4 h-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="flex-1 p-4 space-y-5">
                {/* Service info */}
                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("shop_order_section_service")}</p>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.serviceId ? selectedOrder.serviceId.name.es : t("shop_service_deleted")}
                  </p>
                  {selectedOrder.serviceId?.price && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.serviceId.price} €</p>
                  )}
                  <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${selectedOrder.type === "quote" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                    {selectedOrder.type === "quote" ? t("shop_order_type_quote_label") : t("shop_order_type_direct")}
                  </span>
                </div>

                {/* Client info */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("shop_order_section_client")}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{selectedOrder.name}</p>
                    <a
                      href={`mailto:${selectedOrder.email}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selectedOrder.email}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Message */}
                {selectedOrder.message && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> {t("shop_order_section_message")}
                    </p>
                    <p className="text-sm text-foreground bg-muted/40 rounded-xl p-3 whitespace-pre-line">
                      {selectedOrder.message}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("shop_order_section_status")}</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrder(selectedOrder._id, { status: e.target.value as OrderStatus })}
                    disabled={savingOrder}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Admin note */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("shop_order_section_note")}</p>
                  <Textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder={t("shop_order_note_placeholder")}
                    rows={3}
                    disabled={savingOrder}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={savingOrder || orderNote === selectedOrder.adminNote}
                    onClick={() => updateOrder(selectedOrder._id, { adminNote: orderNote })}
                  >
                    {savingOrder ? t("shop_order_saving") : t("shop_order_save_note")}
                  </Button>
                </div>
              </div>

              <DrawerFooter className="border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 rounded-full self-start"
                  onClick={() => deleteOrder(selectedOrder._id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t("shop_order_delete")}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
