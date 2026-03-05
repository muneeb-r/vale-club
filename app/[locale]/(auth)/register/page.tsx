import { Link } from "@/lib/navigation";
import { getTranslations } from "next-intl/server";
import RegisterForm from "@/components/forms/RegisterForm";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("register_title") };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {t("register_title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("register_subtitle")}</p>
        </div>

        <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border">
          <RegisterForm />

          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("have_account")}{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
