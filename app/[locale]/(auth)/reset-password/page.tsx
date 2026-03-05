import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("reset_title") };
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {t("reset_title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("reset_subtitle")}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
