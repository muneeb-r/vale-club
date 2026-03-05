import type { Metadata } from "next";
import { Poppins, Inter_Tight } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { getServerUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
import NextTopLoader from "nextjs-toploader";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VALE — Directorio de Empresas",
    template: "%s | VALE",
  },
  description: "Encuentra los mejores negocios cerca de ti.",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }

  const [messages, user] = await Promise.all([getMessages(), getServerUser()]);

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${interTight.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <NextTopLoader
          shadow="none"
          color="var(--primary)"
          showSpinner={false}
        />
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="pb-16 sm:pb-0">{children}</div>
          <Footer />
          <BottomNav role={user?.role ?? null} />
          <Toaster position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
