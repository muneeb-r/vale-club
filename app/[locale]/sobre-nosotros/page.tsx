import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import {
  ShieldCheck,
  Star,
  Building2,
  ArrowRight,
  Users,
  Zap,
  Heart,
  BadgeCheck,
} from "lucide-react";
import type { Metadata } from "next";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("about");

  const values = [
    { icon: ShieldCheck, title: t("value1_title"), desc: t("value1_desc") },
    { icon: Star, title: t("value2_title"), desc: t("value2_desc") },
    { icon: Heart, title: t("value3_title"), desc: t("value3_desc") },
    { icon: Zap, title: t("value4_title"), desc: t("value4_desc") },
  ];

  const stats = [
    { value: "500+", label: t("stat_businesses") },
    { value: "50+", label: t("stat_categories") },
    { value: "10K+", label: t("stat_users") },
    { value: "2024", label: t("stat_founded") },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Neon gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/12 via-background to-vale-orange/8" />
        {/* Neon blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-vale-orange/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
            <BadgeCheck className="w-3.5 h-3.5" />
            {t("hero_badge")}
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            {t("hero_title")}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              {t("cta_explore")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full font-semibold hover:bg-muted transition-all"
            >
              {t("cta_register")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative overflow-hidden px-4 py-10">
        <div className="absolute inset-0 bg-linear-to-r from-primary via-primary/90 to-primary/80" />
        <div className="pointer-events-none absolute -top-8 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-36 h-36 rounded-full bg-vale-orange/20 blur-2xl" />
        <div className="relative max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-heading text-3xl font-bold text-white">
                {s.value}
              </p>
              <p className="text-sm text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full bg-vale-orange/6 blur-3xl" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shadow-md shadow-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {t("mission_title")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("mission_p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("mission_p2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="relative overflow-hidden px-4 py-16">
        {/* Neon gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/6 via-background to-vale-orange/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-8 right-8 w-48 h-48 rounded-full bg-vale-orange/8 blur-3xl" />

        <div className="relative max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t("values_title")}
            </h2>
            <p className="text-muted-foreground">{t("values_subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-3 hover:shadow-lg hover:shadow-primary/8 transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/15 flex items-center justify-center">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For businesses CTA ── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row gap-8 items-center justify-between">
            {/* Neon gradient background */}
            <div className="absolute inset-0 bg-linear-to-br from-vale-dark via-vale-dark/95 to-primary/40" />
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-vale-orange/15 blur-3xl" />

            <div className="relative space-y-3 max-w-md">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold tracking-widest uppercase text-primary">
                  {t("biz_badge")}
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-white">
                {t("biz_title")}
              </h2>
              <p className="text-white/60 leading-relaxed">{t("biz_desc")}</p>
            </div>
            <Link
              href="/register"
              className="relative shrink-0 inline-flex items-center gap-2 bg-vale-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-vale-orange/90 transition-all whitespace-nowrap shadow-lg shadow-vale-orange/30"
            >
              {t("biz_cta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="border-t border-border px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("contact_title")}
          </h2>
          <p className="text-muted-foreground">{t("contact_desc")}</p>
          <a
            href="mailto:cuenta@vale.club"
            className="inline-block mt-2 text-primary font-semibold hover:underline"
          >
            cuenta@vale.club
          </a>
        </div>
      </section>
    </main>
  );
}
