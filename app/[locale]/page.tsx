import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Business } from "@/models/Business";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import HeroSearch from "@/components/home/HeroSearch";
import CategoryGrid from "@/components/home/CategoryGrid";
import BusinessCard from "@/components/business/BusinessCard";
import {
  Building2,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import FadeIn from "@/components/home/FadeIn";

export const revalidate = 3600;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");

  await connectDB();

  const [rawCategories, rawBusinesses] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).limit(12).lean(),
    Business.find({ status: "active" })
      .sort({ plan: -1, rating: -1 })
      .limit(6)
      .populate("categories", "name nameEn slug icon")
      .lean(),
  ]);

  const categories = JSON.parse(JSON.stringify(rawCategories));
  const businesses = JSON.parse(JSON.stringify(rawBusinesses));

  const stats = [
    { value: "500+", label: t("stat_businesses") },
    { value: "50+", label: t("stat_categories") },
    { value: "10K+", label: t("stat_users") },
  ];

  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-vale-teal">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <path d="M11 8a3 3 0 0 1 3 3" />
        </svg>
      ),
      title: t("step1_title"),
      desc: t("step1_desc"),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-vale-teal">
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      ),
      title: t("step2_title"),
      desc: t("step2_desc"),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-vale-teal">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
        </svg>
      ),
      title: t("step3_title"),
      desc: t("step3_desc"),
    },
  ];

  const perks = [t("perk1"), t("perk2"), t("perk3"), t("perk4")];

  return (
    <main className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-vale-teal overflow-hidden">
        {/* grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* glow blobs — animate slowly */}
        <div className="animate-blob absolute -top-32 -right-32 w-120 h-120 rounded-full bg-vale-accent/20 blur-3xl pointer-events-none" />
        <div className="animate-blob-slow absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-vale-orange/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-32 text-center space-y-6 md:space-y-8">
          <div
            className="animate-fade-up inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm"
            style={{ animationDelay: "0ms" }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-vale-accent" />
            {t("hero_badge")}
          </div>

          <h1
            className="animate-fade-up font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
            style={{ animationDelay: "80ms" }}
          >
            {t("hero_title_line1")}
            <br />
            <span className="text-vale-accent">{t("hero_title_line2")}</span>
          </h1>

          <p
            className="animate-fade-up text-white/70 text-lg md:text-xl max-w-xl mx-auto"
            style={{ animationDelay: "180ms" }}
          >
            {t("hero_subtitle")}
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
            <HeroSearch />
          </div>

          {/* popular tags */}
          <div
            className="animate-fade-up flex flex-wrap justify-center gap-2 pt-2"
            style={{ animationDelay: "380ms" }}
          >
            {["Restaurantes", "Salones", "Médicos", "Hoteles", "Mecánicos"].map(
              (tag) => (
                <Link
                  key={tag}
                  href={("/search?q=" + encodeURIComponent(tag)) as "/search"}
                  className="text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1 rounded-full transition-colors"
                >
                  {tag}
                </Link>
              ),
            )}
          </div>
        </div>

        {/* wave separator */}
        <div
          className="animate-fade-in relative h-16 overflow-hidden"
          style={{ animationDelay: "500ms" }}
        >
          <svg
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            style={{ fill: "var(--color-vale-bg, #EDF8F9)" }}
          >
            <path d="M0,32 C360,80 1080,-16 1440,32 L1440,64 L0,64 Z" />
          </svg>
        </div>
      </section>

      {/* ─── Stats bar ────────────────────────────────────────────────────── */}
      <section className=" -mt-1">
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <FadeIn>
            <div className="bg-white rounded-2xl shadow-sm border border-border grid grid-cols-3 divide-x divide-border">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-5 px-2 sm:py-6 sm:px-4 text-center"
                >
                  <span className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-vale-teal">
                    {value}
                  </span>
                  <span className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-1 leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────────────────── */}
      <section className=" pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="flex items-end justify-between mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              {t("categories_title")}
            </h2>
            <Link
              href="/search"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              {t("see_all")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
          {categories.length > 0 ? (
            <FadeIn delay={100}>
              <CategoryGrid categories={categories} locale={locale ?? "es"} />
            </FadeIn>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("categories_empty")}
            </p>
          )}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-border py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-8 md:mb-12">
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {t("how_title")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm md:text-base">
              {t("how_subtitle")}
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-border bg-vale-teal/5">
                    {step.icon}
                  </div>
                  <div className="w-7 h-7 bg-vale-teal text-white rounded-full flex items-center justify-center text-sm font-bold font-heading">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Businesses ──────────────────────────────────────────── */}
      {businesses.length > 0 && (
        <section className=" py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <FadeIn className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  {t("featured_title")}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("featured_subtitle")}
                </p>
              </div>
              <Link
                href="/search"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                {t("see_all")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map(
                (
                  business: Parameters<typeof BusinessCard>[0]["business"] & {
                    _id: string;
                  },
                  i: number,
                ) => (
                  <FadeIn key={business._id} delay={i * 80}>
                    <BusinessCard business={business} locale={locale} />
                  </FadeIn>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── List your business CTA ───────────────────────────────────────── */}
      <section className="bg-vale-teal py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
              <div className="text-white space-y-4 md:space-y-5">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-3 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  {t("cta_badge")}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                  {t("cta_title")}
                </h2>
                <p className="text-white/70 text-sm md:text-base">
                  {t("cta_subtitle")}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-vale-orange hover:bg-vale-orange/90 text-white px-6 py-3 rounded-full font-medium text-sm transition-colors"
                >
                  {t("cta_button")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <ul className="space-y-3">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-vale-accent shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Testimonial ──────────────────────────────────────────────────── */}
      <section className=" py-12 px-4">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-vale-orange text-vale-orange"
                />
              ))}
            </div>
            <p className="text-foreground font-heading text-lg font-semibold italic">
              &ldquo;{t("testimonial_quote")}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground">
              {t("testimonial_author")}
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
