import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function adminOnly(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await adminOnly(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  await connectDB();

  const requests = await SubscriptionRequest.find(
    status === "all" ? {} : { status }
  )
    .populate("businessId", "name slug plan")
    .populate("planId", "name price features")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(requests)));
}
