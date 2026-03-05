import { getTranslations } from "next-intl/server";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgot_title") };
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {t("forgot_title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("forgot_subtitle")}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <ForgotPasswordForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
