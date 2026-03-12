import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  await connectDB();
  const orders = await ShopOrder.find({ email: user.email })
    .populate("serviceId", "name priceType price promoPrice")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
