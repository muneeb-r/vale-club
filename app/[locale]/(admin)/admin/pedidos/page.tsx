import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { getTranslations } from "next-intl/server";
import { Package, Clock, CheckCircle2, XCircle, Loader2, CreditCard } from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import AdminOrderActions from "@/components/admin/AdminOrderActions";

const STATUS_CONFIG = {
  new:         { color: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Clock },
  in_progress: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Loader2 },
  done:        { color: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  cancelled:   { color: "bg-red-50 text-red-700 border-red-200",       Icon: XCircle },
} as const;

const LIMIT = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export async function generateMetadata() {
  return { title: "Pedidos — Admin" };
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const { page: pageParam, status: statusFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const t = await getTranslations("shop");
  const ta = await getTranslations("admin");

  await connectDB();

  const filter = statusFilter && statusFilter !== "all" ? { status: statusFilter } : {};

  const [rawOrders, total] = await Promise.all([
    ShopOrder.find(filter)
      .populate("serviceId", "name priceType price promoPrice")
      .sort({ createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    ShopOrder.countDocuments(filter),
  ]);

  const orders = JSON.parse(JSON.stringify(rawOrders)) as Array<{
    _id: string;
    serviceId?: { name: { es: string; en: string; ca: string }; price?: number; promoPrice?: number };
    type: "purchase" | "quote";
    name: string;
    email: string;
    message: string;
    status: keyof typeof STATUS_CONFIG;
    paymentStatus?: "unpaid" | "paid";
    adminNote?: string;
    redsysOrderId?: string;
    createdAt: string;
  }>;

  const statuses = ["all", "new", "in_progress", "done", "cancelled"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {ta("orders")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{total} pedidos</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const isActive = (statusFilter ?? "all") === s;
          const url = s === "all" ? "/admin/pedidos" : `/admin/pedidos?status=${s}`;
          return (
            <a
              key={s}
              href={url}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Todos" : t(`my_orders_status_${s}` as Parameters<typeof t>[0])}
            </a>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("my_orders_empty")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
              const { Icon } = cfg;
              const price = order.serviceId?.promoPrice ?? order.serviceId?.price;
              return (
                <div key={order._id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-sm text-foreground truncate">
                        {order.serviceId?.name?.es ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.name !== order.email ? `${order.name} · ` : ""}{order.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.type === "quote" ? t("my_orders_type_quote") : t("my_orders_type_purchase")}
                        {price ? ` · ${price} €` : ""}
                        {order.redsysOrderId && (
                          <span className="ml-2 font-mono opacity-60">#{order.redsysOrderId}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {order.paymentStatus === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CreditCard className="w-3 h-3" />
                          {t("payment_paid")}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {t(`my_orders_status_${order.status}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                  </div>

                  {order.message && (
                    <div className="bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-0.5">{t("my_orders_message")}</p>
                      <p className="text-sm text-foreground">{order.message}</p>
                    </div>
                  )}

                  {order.adminNote && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-primary font-medium mb-0.5">Nota interna</p>
                      <p className="text-sm text-foreground">{order.adminNote}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <AdminOrderActions orderId={order._id} currentStatus={order.status} currentNote={order.adminNote ?? ""} />
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationBar
            page={page}
            total={total}
            limit={LIMIT}
            buildUrl={(p) => `/admin/pedidos?page=${p}${statusFilter ? `&status=${statusFilter}` : ""}`}
          />
        </>
      )}
    </div>
  );
}
