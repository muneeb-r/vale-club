"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserEditDrawerProps {
  user: UserRow | null;
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  business_owner: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
};

export default function UserEditDrawer({ user, onClose }: UserEditDrawerProps) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setNewPassword("");
      setError("");
      setConfirmDelete(false);
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user!._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user!._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar");
        setConfirmDelete(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Error de red");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Drawer
      open={!!user}
      onOpenChange={(open) => { if (!open) onClose(); }}
      direction="right"
    >
      <DrawerContent className="w-full max-w-md flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 flex flex-row items-center justify-between gap-4">
          <DrawerTitle>{t("edit_user")}</DrawerTitle>
          <DrawerClose asChild>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors text-xl leading-none shrink-0">
              ×
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {user && (
            <>
              {/* Avatar + meta */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground"}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <hr className="border-border" />

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("user_name")}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("user_email")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("user_role")}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-input bg-background rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="user">{t("role_user")}</option>
                  <option value="business_owner">{t("role_business_owner")}</option>
                  <option value="admin">{t("role_admin")}</option>
                </select>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("user_new_password")}
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <DrawerFooter className="border-t border-border px-5 py-4 gap-3">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !email.trim()}
              className="flex-1 rounded-full"
            >
              {saving ? t("saving") : t("save")}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-full">
                {t("cancel")}
              </Button>
            </DrawerClose>
          </div>

          {/* Delete zone */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors w-full justify-center pt-1"
            >
              <Trash2 className="size-3.5" />
              {t("delete_user")}
            </button>
          ) : (
            <div className="bg-destructive/10 rounded-xl p-3 space-y-2">
              <p className="text-xs text-destructive text-center">{t("confirm_delete_user")}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-7"
                >
                  {deleting ? "..." : t("delete_user")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full text-xs h-7"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
