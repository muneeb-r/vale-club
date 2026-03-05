import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BusinessReview } from "@/models/BusinessReview";

// GET /api/business-reviews/[userId]
// Returns business-on-customer reviews for a user.
// Only accessible by the user themselves (or admin).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const token = getTokenFromRequest(req);
  const authUser = token ? await verifyToken(token) : null;
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  // Only the user themselves or admin can view
  if (authUser.userId !== userId && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const reviews = await BusinessReview.find({ userId, isPublished: true })
    .populate("businessId", "name slug logo")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ reviews });
}
