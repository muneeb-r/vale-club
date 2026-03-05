"use client";

import { usePathname } from "@/lib/navigation";
import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Home, Search, LayoutDashboard, UserCircle2, LogIn } from "lucide-react";

interface BottomNavProps {
  role: "admin" | "business_owner" | "user" | null;
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href);
  }

  const profileHref =
    role === "admin" ? "/admin" : role === "user" ? "/perfil" : "/dashboard";

  const profileLabel =
    role === "admin" ? t("admin") : role === "user" ? t("my_profile") : t("dashboard");

  const ProfileIcon =
    role === "business_owner" ? LayoutDashboard : UserCircle2;

  const items = [
    { href: "/", label: t("home"), Icon: Home },
    { href: "/search", label: t("directory"), Icon: Search },
    ...(role
      ? [{ href: profileHref, label: profileLabel, Icon: ProfileIcon }]
      : [{ href: "/login", label: t("login"), Icon: LogIn }]),
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-white/90 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-stretch">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-vale-teal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-vale-teal" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
