import { getTranslations } from "next-intl/server";
import { Mail, MessageSquare, Clock } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import type { Metadata } from "next";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("contact");

  const info = [
    {
      icon: Mail,
      label: t("info_email_label"),
      value: "cuenta@vale.club",
      href: "mailto:cuenta@vale.club",
    },
    {
      icon: Clock,
      label: t("info_response_label"),
      value: t("info_response_value"),
      href: null,
    },
    {
      icon: MessageSquare,
      label: t("info_lang_label"),
      value: t("info_lang_value"),
      href: null,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-vale-dark text-white px-4 py-14">
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-vale-accent">
            {t("badge")}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            {t("title")}
          </h1>
          <p className="text-white/50 text-base max-w-lg">{t("subtitle")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info sidebar */}
          <aside className="space-y-6">
            {info.map((item) => (
              <div key={item.label} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground font-medium">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Divider */}
            <div className="border-t border-border pt-6 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("info_business_label")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("info_business_desc")}
              </p>
              <a
                href="/register"
                className="inline-block text-sm text-primary font-semibold hover:underline mt-1"
              >
                {t("info_business_cta")} →
              </a>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6">
              {t("form_title")}
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
