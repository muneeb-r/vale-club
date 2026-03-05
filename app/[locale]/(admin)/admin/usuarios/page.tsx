import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

interface UsersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}

export async function generateMetadata({ params }: UsersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("users") };
}

export default async function AdminUsersPage({ params, searchParams }: UsersPageProps) {
  const { locale } = await params;
  const { q = "", role = "", page: pageStr = "1" } = await searchParams;
  const t = await getTranslations("admin");

  const page = Math.max(1, parseInt(pageStr, 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  if (role && ["admin", "business_owner", "user"].includes(role)) {
    filter.role = role;
  }

  const [rawUsers, total] = await Promise.all([
    User.find(filter)
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const users = JSON.parse(JSON.stringify(rawUsers)) as {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    params.set("page", String(p));
    return `/admin/usuarios?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("users")}
        </h1>
        <span className="text-sm text-muted-foreground">({total})</span>
      </div>

      {/* Search + role filter */}
      <form method="GET" action="/admin/usuarios" className="flex flex-col sm:flex-row gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("user_search_placeholder")}
          className="flex-1 border border-border rounded-xl px-4 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          name="role"
          defaultValue={role}
          className="border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t("all_roles")}</option>
          <option value="user">{t("role_user")}</option>
          <option value="business_owner">{t("role_business_owner")}</option>
          <option value="admin">{t("role_admin")}</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("search")}
        </button>
      </form>

      {/* Table */}
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("no_users_found")}</p>
      ) : (
        <AdminUsersTable users={users} locale={locale} />
      )}

      <PaginationBar
        page={page}
        total={total}
        limit={limit}
        buildUrl={buildUrl}
      />
    </div>
  );
}
