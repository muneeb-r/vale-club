"use client";

import { useState, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, X, Package, CreditCard, Loader2 } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";

interface Service {
  _id: string;
  name: { es: string; en: string; ca: string };
  priceType: "fixed" | "quote";
  price?: number;
  promoPrice?: number;
}

interface ShopOrderDrawerProps {
  service: Service;
  locale: string;
  initialName?: string;
  initialEmail?: string;
}

export default function ShopOrderDrawer({
  service,
  locale,
  initialName = "",
  initialEmail = "",
}: ShopOrderDrawerProps) {
  const t = useTranslations("shop");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isQuote = service.priceType === "quote";
  const isFixed = service.priceType === "fixed";
  const [cardPaying, setCardPaying] = useState(false);
  const [redsysData, setRedsysData] = useState<{ url: string; params: Record<string, string> } | null>(null);
  const cardFormRef = useRef<HTMLFormElement>(null);

  function localeName(obj: { es: string; en: string; ca: string }) {
    if (locale === "en") return obj.en || obj.es;
    if (locale === "ca") return obj.ca || obj.es;
    return obj.es;
  }

  function handleOpen() {
    setSuccess(false);
    setError("");
    setMessage("");
    setOpen(true);
  }

  async function handleCardPay() {
    if (!name.trim() || !email.trim()) {
      setError(t("order_name_email_required"));
      return;
    }
    setCardPaying(true);
    setError("");
    try {
      const res = await fetch("/api/redsys/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service._id,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error");
      }
      const data = await res.json();
      setRedsysData(data);
      setTimeout(() => cardFormRef.current?.submit(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("order_error"));
      setCardPaying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service._id,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("order_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hidden Redsys form — auto-submits after data arrives */}
      {redsysData && (
        <form ref={cardFormRef} method="POST" action={redsysData.url} style={{ display: "none" }}>
          {Object.entries(redsysData.params).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}

      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        {isQuote ? t("cta_quote") : t("cta_contact")}
        <ArrowRight className="w-3 h-3" />
      </button>

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent className="max-w-md w-full overflow-y-auto">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DrawerTitle className="font-heading text-lg">
                  {isQuote ? t("order_quote_title") : t("order_buy_title")}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  {localeName(service.name)}
                  {!isQuote && service.promoPrice && service.promoPrice !== service.price ? (
                    <span className="ml-2 font-semibold text-foreground">
                      {service.promoPrice} €
                      <span className="ml-1 text-xs line-through text-muted-foreground">
                        {service.price} €
                      </span>
                    </span>
                  ) : !isQuote && service.price ? (
                    <span className="ml-2 font-semibold text-foreground">{service.price} €</span>
                  ) : null}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="shrink-0 -mt-1">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 p-4">
            {success ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <div>
                  <p className="font-heading font-semibold text-foreground text-lg">
                    {t("order_sent_title")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("order_sent_description")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-2 w-full">
                  <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
                    {t("order_close")}
                  </Button>
                  <Link
                    href={"/perfil" as "/"}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {t("my_orders_link")}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="order-name">{t("order_name")}</Label>
                  <Input
                    id="order-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("order_name_placeholder")}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order-email">{t("order_email")}</Label>
                  <Input
                    id="order-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("order_email_placeholder")}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order-message">
                    {t("order_message")}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({t("order_message_optional")})
                    </span>
                  </Label>
                  <Textarea
                    id="order-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("order_message_placeholder")}
                    rows={4}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                {isFixed ? (
                  <Button
                    type="button"
                    className="w-full rounded-full gap-2"
                    disabled={cardPaying || loading}
                    onClick={handleCardPay}
                  >
                    {cardPaying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {cardPaying ? t("card_paying") : t("pay_by_card")}
                  </Button>
                ) : (
                  <Button type="submit" className="w-full rounded-full" disabled={loading}>
                    {loading ? t("order_submitting") : t("order_submit_quote")}
                  </Button>
                )}
              </form>
            )}
          </div>

          <DrawerFooter className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground text-center">
              {t("order_footer")}
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
