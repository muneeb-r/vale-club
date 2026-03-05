import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Plan } from "@/models/Plan";

export async function GET() {
  await connectDB();
  const plans = await Plan.find({ isActive: true }).sort({ price: 1 }).lean();
  return NextResponse.json(plans);
}
