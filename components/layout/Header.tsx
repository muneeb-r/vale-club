import { Link } from "@/lib/navigation";
import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import LogoutButton from "./LogoutButton";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileMenu from "./MobileMenu";
import Image from "next/image";

export default async function Header() {
  const user = await getServerUser();
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading font-bold text-xl tracking-[0.2em] shrink-0"
        >
          <Image
            src="/valeapp-desktop-logo.png"
            width={100}
            height={40}
            alt="Vale"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link
            href="/search"
            className="flex items-center px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
          >
            {t("directory")}
          </Link>
          <Link
            href="/sobre-nosotros"
            className="flex items-center px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
          >
            {t("about")}
          </Link>

          <div className="w-px h-4 bg-border mx-1" />

          <LocaleSwitcher />

          <div className="w-px h-4 bg-border mx-1" />

          {user ? (
            <>
              <Link
                href={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "user"
                      ? "/perfil"
                      : "/dashboard"
                }
                className="flex items-center px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              >
                {user.role === "admin"
                  ? t("admin")
                  : user.role === "user"
                    ? t("my_profile")
                    : t("dashboard")}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="ml-1 bg-vale-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-vale-orange/90 active:scale-95 transition-all"
              >
                {t("register")}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: locale switcher always visible + hamburger menu */}
        <div className="sm:hidden flex items-center gap-1">
          <LocaleSwitcher />
          <MobileMenu>
            <div className="px-1 py-1 space-y-0.5 text-sm">
              <Link
                href="/search"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              >
                {t("directory")}
              </Link>
              <Link
                href="/sobre-nosotros"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              >
                {t("about")}
              </Link>

              {user ? (
                <>
                  <div className="h-px bg-border mx-3 my-1" />
                  <LogoutButton />
                </>
              ) : (
                <>
                  <div className="h-px bg-border mx-3 my-1" />
                  <Link
                    href="/login"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-vale-orange font-semibold hover:bg-vale-orange/8 transition-colors"
                  >
                    {t("register")}
                  </Link>
                </>
              )}
            </div>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
