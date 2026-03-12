import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const filter = status ? { status } : {};
  const orders = await ShopOrder.find(filter)
    .populate("serviceId", "name priceType price")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
