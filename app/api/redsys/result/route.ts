import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PendingRedsysPayment } from "@/models/PendingRedsysPayment";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orderId = searchParams.get("orderId");
  const result = searchParams.get("result");

  const BASE_URL = process.env.BASE_URL!;

  if (!orderId) {
    return NextResponse.redirect(`${BASE_URL}/shop?payment=failed`);
  }

  await connectDB();
  const pending = await PendingRedsysPayment.findOne({ orderId }).lean();

  if (!pending || result !== "ok") {
    const dest = pending?.type === "plan" ? "/dashboard/plan" : "/shop";
    return NextResponse.redirect(`${BASE_URL}${dest}?payment=failed`);
  }

  if (pending.type === "plan") {
    return NextResponse.redirect(`${BASE_URL}/dashboard/plan?payment=ok`);
  }

  return NextResponse.redirect(`${BASE_URL}/shop?payment=ok`);
}
