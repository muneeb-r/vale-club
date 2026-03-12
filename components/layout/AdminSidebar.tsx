"use client";

import { Link, usePathname } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Building2, Tag, LayoutDashboard, ShieldCheck, CreditCard, Users, BadgeCheck, ShoppingBag } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  const links = [
    { href: "/admin" as const, label: t("title"), icon: LayoutDashboard, exact: true },
    { href: "/admin/empresas" as const, label: t("businesses"), icon: Building2, exact: false },
    { href: "/admin/categorias" as const, label: t("categories"), icon: Tag, exact: false },
    { href: "/admin/proofs" as const, label: t("proofs"), icon: ShieldCheck, exact: false },
    { href: "/admin/planes" as const, label: t("plans"), icon: CreditCard, exact: false },
    { href: "/admin/suscripciones" as const, label: t("subscriptions"), icon: BadgeCheck, exact: false },
    { href: "/admin/usuarios" as const, label: t("users"), icon: Users, exact: false },
    { href: "/admin/shop" as const, label: "Vale Shop", icon: ShoppingBag, exact: false },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card hidden md:block">
      <div className="p-4 border-b border-border">
        <p className="font-heading font-semibold text-sm text-vale-dark uppercase tracking-wide">
          Admin
        </p>
      </div>
      <nav className="p-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
