"use client";

import { useState } from "react";
import { Link, usePathname } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Phone,
  Star,
  CreditCard,
  ChevronLeft,
  Menu,
  Building2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface NavLink {
  href:
    | "/dashboard"
    | "/dashboard/perfil"
    | "/dashboard/contacto"
    | "/dashboard/resenas"
    | "/dashboard/plan";
  label: string;
  icon: React.ElementType;
  exact: boolean;
}

function NavLinks({
  links,
  collapsed,
  onMobile,
  onClick,
}: {
  links: NavLink[];
  collapsed: boolean;
  onMobile: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            title={!onMobile && collapsed ? link.label : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative",
              onMobile
                ? "gap-3 px-4 py-3"
                : collapsed
                  ? "justify-center w-10 h-10 mx-auto"
                  : "gap-3 px-3 py-2.5",
              isActive
                ? "bg-vale-teal text-white shadow-sm"
                : "text-muted-foreground hover:bg-vale-teal/8 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "shrink-0",
                onMobile || !collapsed ? "w-4 h-4" : "w-5 h-5",
              )}
            />
            {(onMobile || !collapsed) && <span>{link.label}</span>}
            {!onMobile && collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {link.label}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

interface DashboardSidebarProps {
  businessName?: string;
}

export default function DashboardSidebar({
  businessName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: NavLink[] = [
    {
      href: "/dashboard",
      label: t("overview"),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/dashboard/perfil",
      label: t("profile"),
      icon: User,
      exact: false,
    },
    {
      href: "/dashboard/contacto",
      label: t("contact"),
      icon: Phone,
      exact: false,
    },
    {
      href: "/dashboard/resenas",
      label: t("reviews"),
      icon: Star,
      exact: false,
    },
    {
      href: "/dashboard/plan",
      label: t("plan_section"),
      icon: CreditCard,
      exact: false,
    },
  ];

  const activeLabel = links.find((l) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href),
  )?.label;

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-30 bg-card border-b border-border">
        <div className="px-4 h-11 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2.5 text-sm font-medium text-foreground min-w-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-heading font-semibold truncate">
              {businessName || t("title")}
            </span>
          </button>
          {activeLabel && (
            <div className="ml-auto text-xs text-muted-foreground font-medium shrink-0">
              {activeLabel}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile drawer nav ── */}
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
        <DrawerContent className="h-full flex flex-col">
          <DrawerHeader className="border-b border-border px-5 py-4 flex flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-vale-teal/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-vale-teal" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
                  {t("title")}
                </p>
                {businessName && (
                  <DrawerTitle className="font-heading font-bold text-sm text-foreground truncate leading-tight">
                    {businessName}
                  </DrawerTitle>
                )}
              </div>
            </div>
            <DrawerClose asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0">
                ×
              </button>
            </DrawerClose>
          </DrawerHeader>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            <NavLinks
              links={links}
              collapsed={false}
              onMobile
              onClick={() => setMobileOpen(false)}
            />
          </nav>
        </DrawerContent>
      </Drawer>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border bg-card transition-all duration-300 ease-in-out sticky top-[5.1rem] h-screen",
          collapsed ? "w-15" : "w-60",
        )}
      >
        {/* Header — same height as main nav (h-20) */}
        <div
          className={cn(
            "relative flex items-center h-20 border-b border-border shrink-0",
            collapsed ? "px-0 justify-center" : "px-4 gap-3",
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-vale-teal/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-vale-teal" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                {t("title")}
              </p>
              {businessName && (
                <p className="font-heading font-bold text-sm text-foreground truncate leading-tight">
                  {businessName}
                </p>
              )}
            </div>
          )}
          {/* Collapse tab on right border edge */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir" : "Colapsar"}
            className="absolute -right-2.75 top-1/2 -translate-y-1/2 z-10 h-8 w-2.75 rounded-r-md bg-border hover:bg-vale-teal/20 flex items-center justify-center transition-colors duration-150"
          >
            <ChevronLeft
              className={cn(
                "w-2.5 h-2.5 text-muted-foreground transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 p-2 space-y-0.5",
            collapsed && "flex flex-col items-center px-2",
          )}
        >
          <NavLinks links={links} collapsed={collapsed} onMobile={false} />
        </nav>
      </aside>
    </>
  );
}
