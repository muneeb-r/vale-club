"use client";

import { useRouter } from "@/lib/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("nav");

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
    >
      {isPending ? "..." : t("logout")}
    </button>
  );
}
