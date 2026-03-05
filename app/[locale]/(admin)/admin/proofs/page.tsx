import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { Business } from "@/models/Business";
import ProofQueue from "@/components/admin/ProofQueue";
import ProofFilters from "@/components/admin/ProofFilters";
import PaginationBar from "@/components/ui/PaginationBar";

interface ProofsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    page?: string;
    q?: string;
    user?: string;
    rating?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export async function generateMetadata({ params }: ProofsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("proofs") };
}

const LIMIT = 20;

export default async function ProofsPage({ searchParams }: ProofsPageProps) {
  const {
    status = "pending",
    page: pageParam,
    q = "",
    user: userQ = "",
    rating = "",
    dateFrom = "",
    dateTo = "",
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam || "1"));
  const t = await getTranslations("admin");

  await connectDB();

  // Build filter
  const filter: Record<string, unknown> = { proofStatus: status };

  // Business name search → resolve to businessIds first
  if (q.trim()) {
    const matchedBizIds = await Business.find({
      name: { $regex: q.trim(), $options: "i" },
    })
      .select("_id")
      .lean()
      .then((docs) => docs.map((d) => d._id));
    filter.businessId = { $in: matchedBizIds };
  }

  // User name / email search → resolve to userIds first
  if (userQ.trim()) {
    const matchedUserIds = await User.find({
      $or: [
        { name: { $regex: userQ.trim(), $options: "i" } },
        { email: { $regex: userQ.trim(), $options: "i" } },
      ],
    })
      .select("_id")
      .lean()
      .then((docs) => docs.map((d) => d._id));
    filter.userId = { $in: matchedUserIds };
  }

  // Rating filter (±0.5 to match integer ratings stored as numbers)
  if (rating) {
    const r = parseInt(rating);
    if (!isNaN(r)) filter.rating = { $gte: r - 0.5, $lt: r + 0.5 };
  }

  // Date range filter
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    filter.createdAt = dateFilter;
  }

  const [rawReviews, total] = await Promise.all([
    Review.find(filter)
      .populate("businessId", "name slug")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const reviews = JSON.parse(JSON.stringify(rawReviews));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    params.set("status", status);
    if (q) params.set("q", q);
    if (userQ) params.set("user", userQ);
    if (rating) params.set("rating", rating);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("proof_queue")}{" "}
          <span className="text-muted-foreground font-normal text-lg">({total})</span>
        </h1>

        {/* Status tabs */}
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "pending"
                ? t("proof_pending")
                : s === "approved"
                ? t("proof_approved")
                : t("proof_rejected")}
            </a>
          ))}
        </div>
      </div>

      {/* Search + filter bar */}
      <ProofFilters
        status={status}
        q={q}
        user={userQ}
        rating={rating}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <ProofQueue reviews={reviews} />

      <PaginationBar
        page={page}
        total={total}
        limit={LIMIT}
        buildUrl={buildPageUrl}
      />
    </div>
  );
}
