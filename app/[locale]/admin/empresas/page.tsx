import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { getTranslations } from "next-intl/server";
import BusinessTable from "@/components/admin/BusinessTable";
import PaginationBar from "@/components/ui/PaginationBar";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

interface AdminEmpresasPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: AdminEmpresasPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("businesses") };
}

export default async function AdminEmpresasPage({
  searchParams,
}: AdminEmpresasPageProps) {
  const rawParams = await searchParams;
  const t = await getTranslations("admin");

  const q = rawParams.q || "";
  const status = rawParams.status || "all";
  const LIMIT = 20;
  const page = Math.max(1, parseInt(rawParams.page || "1"));

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (q) filter.$text = { $search: q };
  if (status === "pending" || status === "inreview" || status === "active" || status === "blocked") filter.status = status;

  const projection = q ? { score: { $meta: "textScore" } } : undefined;
  const sortOptions = q
    ? ({ score: { $meta: "textScore" } } as Record<string, { $meta: string }>)
    : ({ createdAt: -1 } as Record<string, -1>);

  const [rawBusinesses, total] = await Promise.all([
    Business.find(filter, projection)
      .sort(sortOptions)
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .populate("ownerId", "name email")
      .lean(),
    Business.countDocuments(filter),
  ]);

  const businesses = JSON.parse(JSON.stringify(rawBusinesses));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("businesses")}{" "}
          <span className="text-muted-foreground font-normal text-lg">
            ({total})
          </span>
        </h1>
        <Link href="/admin/empresas/nueva">
          <Button className="rounded-full bg-primary text-primary-foreground">
            {t("new_business")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/empresas" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("search_business_placeholder")}
          className="flex-1 border border-border rounded-xl px-4 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          {t("search")}
        </button>
        {q && (
          <Link
            href={status !== "all" ? `/admin/empresas?status=${status}` : "/admin/empresas"}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            ✕
          </Link>
        )}
      </form>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "inreview", "active", "blocked"] as const).map((s) => (
          <Link
            key={s}
            href={("/admin/empresas?status=" + s + (q ? `&q=${encodeURIComponent(q)}` : "")) as "/admin/empresas"}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t(s)}
          </Link>
        ))}
      </div>

      <BusinessTable businesses={businesses} />

      <PaginationBar
        page={page}
        total={total}
        limit={LIMIT}
        buildUrl={(p) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (status !== "all") params.set("status", status);
          params.set("page", p.toString());
          return `/admin/empresas?${params.toString()}`;
        }}
      />
    </div>
  );
}
