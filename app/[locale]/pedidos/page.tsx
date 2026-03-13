import { getServerUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { Package, ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  new:         { color: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Clock },
  in_progress: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Loader2 },
  done:        { color: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  cancelled:   { color: "bg-red-50 text-red-700 border-red-200",       Icon: XCircle },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

interface PopulatedOrder {
  _id: string;
  serviceId?: { name: { es: string; en: string; ca: string }; price?: number; promoPrice?: number };
  type: "purchase" | "quote";
  message: string;
  status: OrderStatus;
  adminNote: string;
  createdAt: string;
}

interface PedidosPageProps {
  searchParams: Promise<{ payment?: string }>;
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const user = await getServerUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/pedidos?payment=ok")}`);

  const { payment } = await searchParams;

  const t = await getTranslations("shop");

  await connectDB();
  const rawOrders = await ShopOrder.find({ email: user.email })
    .populate("serviceId", "name priceType price promoPrice")
    .sort({ createdAt: -1 })
    .lean();

  const orders: PopulatedOrder[] = JSON.parse(JSON.stringify(rawOrders));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Vale Shop
        </Link>

        <div className="space-y-2 mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {t("my_orders_title")}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {payment === "ok" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold">{t("payment_success_title")}</p>
              <p className="text-green-700 mt-0.5">{t("payment_success_desc")}</p>
            </div>
          </div>
        )}

        {payment === "failed" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <p>{t("payment_failed")}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("my_orders_empty")}</p>
          </div>
        ) : (
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

                  {order.adminNote && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-primary font-medium mb-0.5">Nota del equipo</p>
                      <p className="text-sm text-foreground">{order.adminNote}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t("my_orders_date")}: {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
