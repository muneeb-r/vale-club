import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Admin: get all businesses (no status filter by default)
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 20;

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (q) filter.$text = { $search: q };
  if (status === "pending" || status === "inreview" || status === "active" || status === "blocked") filter.status = status;

  const projection = q ? { score: { $meta: "textScore" } } : undefined;
  const sortOptions = q
    ? ({ score: { $meta: "textScore" } } as Record<string, { $meta: string }>)
    : ({ createdAt: -1 } as Record<string, -1>);

  const [businesses, total] = await Promise.all([
    Business.find(filter, projection)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("ownerId", "name email")
      .lean(),
    Business.countDocuments(filter),
  ]);

  return NextResponse.json({ businesses, total, page, limit });
}
