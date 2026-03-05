"use client";

import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/lib/utils";
import { MessageCircle, Phone, Mail, Globe, Instagram } from "lucide-react";

interface ContactButtonsProps {
  business: {
    name: string;
    contactWhatsApp?: string;
    contactEmail?: string;
    contactWeb?: string;
    contactInstagram?: string;
    contactPhone?: string;
  };
}

export default function ContactButtons({ business }: ContactButtonsProps) {
  const t = useTranslations("business");

  const buttons = [
    business.contactWhatsApp && {
      label: t("whatsapp"),
      href: whatsappUrl(
        business.contactWhatsApp,
        `Hola, vi tu perfil en VALE: ${business.name}`
      ),
      className:
        "bg-[#25D366] text-white hover:bg-[#20bd5a] active:bg-[#1ba84e]",
      icon: MessageCircle,
    },
    business.contactPhone && {
      label: business.contactPhone,
      href: `tel:${business.contactPhone}`,
      className: "bg-primary text-primary-foreground hover:bg-primary/90",
      icon: Phone,
    },
    business.contactEmail && {
      label: t("email"),
      href: `mailto:${business.contactEmail}`,
      className:
        "bg-card border border-primary text-primary hover:bg-muted",
      icon: Mail,
    },
    business.contactInstagram && {
      label: `@${business.contactInstagram.replace("@", "")}`,
      href: `https://instagram.com/${business.contactInstagram.replace("@", "")}`,
      className:
        "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90",
      icon: Instagram,
    },
    business.contactWeb && {
      label: t("website"),
      href: business.contactWeb.startsWith("http")
        ? business.contactWeb
        : `https://${business.contactWeb}`,
      className:
        "bg-card border border-border text-foreground hover:bg-muted",
      icon: Globe,
    },
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    className: string;
    icon: React.ElementType;
  }>;

  if (buttons.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
      <p className="text-sm font-medium text-muted-foreground text-center">
        {t("contact")}
      </p>
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-full font-medium text-sm transition-all ${btn.className}`}
        >
          <btn.icon className="w-4 h-4" />
          <span>{btn.label}</span>
        </a>
      ))}
    </div>
  );
}
