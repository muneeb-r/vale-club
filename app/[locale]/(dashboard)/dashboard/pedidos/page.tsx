import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Package, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";

const STATUS_CONFIG = {
  new:         { color: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Clock },
  in_progress: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Loader2 },
  done:        { color: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  cancelled:   { color: "bg-red-50 text-red-700 border-red-200",       Icon: XCircle },
} as const;

const LIMIT = 20;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DashboardPedidosPage({ searchParams }: PageProps) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const t = await getTranslations("shop");

  await connectDB();

  const [rawOrders, total] = await Promise.all([
    ShopOrder.find({})
      .populate("serviceId", "name priceType price promoPrice")
      .sort({ createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    ShopOrder.countDocuments({}),
  ]);

  const orders = JSON.parse(JSON.stringify(rawOrders)) as Array<{
    _id: string;
    serviceId?: { name: { es: string; en: string; ca: string }; price?: number; promoPrice?: number };
    type: "purchase" | "quote";
    name: string;
    email: string;
    message: string;
    status: keyof typeof STATUS_CONFIG;
    adminNote: string;
    createdAt: string;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          {t("my_orders_title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{total} pedidos</p>
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
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {order.serviceId?.name?.es ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.name !== order.email ? `${order.name} · ` : ""}{order.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.type === "quote" ? t("my_orders_type_quote") : t("my_orders_type_purchase")}
                        {price ? ` · ${price} €` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium shrink-0 ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {t(`my_orders_status_${order.status}` as Parameters<typeof t>[0])}
                    </span>
                  </div>

                  {order.message && (
                    <div className="bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-0.5">{t("my_orders_message")}</p>
                      <p className="text-sm text-foreground">{order.message}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t("my_orders_date")}: {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>

          <PaginationBar
            page={page}
            total={total}
            limit={LIMIT}
            buildUrl={(p) => `/dashboard/pedidos?page=${p}`}
          />
        </>
      )}
    </div>
  );
}
