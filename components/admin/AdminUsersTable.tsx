"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import UserEditDrawer from "@/components/admin/UserEditDrawer";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminUsersTableProps {
  users: UserRow[];
  locale: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  business_owner: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
};

export default function AdminUsersTable({ users, locale }: AdminUsersTableProps) {
  const t = useTranslations("admin");
  const [editing, setEditing] = useState<UserRow | null>(null);

  const roleLabels: Record<string, string> = {
    admin: t("role_admin"),
    business_owner: t("role_business_owner"),
    user: t("role_user"),
  };

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("user_name")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                {t("user_email")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("user_role")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                {t("user_registered")}
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium text-foreground truncate max-w-35">
                      {user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  <span className="truncate max-w-50 block">{user.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(user)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    title={t("edit_user")}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserEditDrawer user={editing} onClose={() => setEditing(null)} />
    </>
  );
}
