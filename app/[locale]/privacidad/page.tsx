import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("privacy");

  const sections = [
    { title: t("s1_title"), body: t("s1_body") },
    { title: t("s2_title"), body: t("s2_body") },
    { title: t("s3_title"), body: t("s3_body") },
    { title: t("s4_title"), body: t("s4_body") },
    { title: t("s5_title"), body: t("s5_body") },
    { title: t("s6_title"), body: t("s6_body") },
    { title: t("s7_title"), body: t("s7_body") },
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
          <p className="text-white/50 text-sm">{t("last_updated")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <p className="text-vale-text leading-relaxed">{t("intro")}</p>

        {sections.map((s, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-foreground">
              {i + 1}. {s.title}
            </h2>
            <p className="text-vale-text leading-relaxed whitespace-pre-line">
              {s.body}
            </p>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("contact_title")}
          </h2>
          <p className="text-vale-text leading-relaxed">{t("contact_body")}</p>
          <a
            href="mailto:cuenta@vale.club"
            className="inline-block text-primary font-semibold hover:underline"
          >
            cuenta@vale.club
          </a>
        </section>
      </div>
    </main>
  );
}
