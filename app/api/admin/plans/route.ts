import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Plan } from "@/models/Plan";
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

  await connectDB();
  const plans = await Plan.find().sort({ price: 1 }).lean();
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const user = await adminOnly(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, price, features, isActive } = await req.json();

  if ((!name?.es && !name?.en) || price === undefined) {
    return NextResponse.json({ error: "Nombre y precio requeridos" }, { status: 400 });
  }

  await connectDB();
  const plan = await Plan.create({
    name: { es: (name.es ?? "").trim(), en: (name.en ?? "").trim() },
    price: Number(price),
    features: Array.isArray(features)
      ? features.filter((f: { es?: string; en?: string }) => f?.es || f?.en)
      : [],
    isActive: isActive !== false,
  });

  return NextResponse.json(plan, { status: 201 });
}
