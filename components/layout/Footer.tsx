import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import Image from "next/image";

export default async function Footer() {
  const t = await getTranslations("footer");

  const columns = [
    {
      heading: t("col_directory"),
      links: [
        { label: t("link_search"), href: "/search" },
        { label: t("link_register"), href: "/register" },
        { label: t("link_login"), href: "/login" },
      ],
    },
    {
      heading: t("col_company"),
      links: [
        { label: t("link_about"), href: "/sobre-nosotros" },
        { label: t("link_contact"), href: "/contacto" },
      ],
    },
    {
      heading: t("col_legal"),
      links: [
        { label: t("link_privacy"), href: "/privacidad" },
        { label: t("link_terms"), href: "/terminos" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-border sm:mb-0 mb-14">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1 space-y-4">
          <Link href="/" className="inline-block">
            <Image
              src="/valeapp-desktop-logo.png"
              alt="VALE"
              width={110}
              height={60}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {t("brand_desc")}
          </p>
          <a
            href="mailto:cuenta@vale.club"
            className="inline-block text-sm text-primary hover:text-primary/80 transition-colors"
          >
            cuenta@vale.club
          </a>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.heading} className="space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/60">
              {col.heading}
            </h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as "/"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
          <p>
            © {new Date().getFullYear()} VALE — {t("tagline")}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacidad"
              className="hover:text-foreground transition-colors"
            >
              {t("link_privacy")}
            </Link>
            <Link
              href="/terminos"
              className="hover:text-foreground transition-colors"
            >
              {t("link_terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
