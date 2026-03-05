import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-8xl font-heading font-bold text-primary/20">404</div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("not_found")}
        </h1>
        <p className="text-muted-foreground">{t("not_found_description")}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          {t("go_home")}
        </Link>
      </div>
    </div>
  );
}
