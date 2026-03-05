import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Plan } from "@/models/Plan";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

async function adminOnly(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await adminOnly(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = { es: (body.name.es ?? "").trim(), en: (body.name.en ?? "").trim() };
  if (body.price !== undefined) update.price = Number(body.price);
  if (body.features !== undefined)
    update.features = Array.isArray(body.features)
      ? body.features.filter((f: { es?: string; en?: string }) => f?.es || f?.en)
      : [];
  if (body.isActive !== undefined) update.isActive = body.isActive;

  const plan = await Plan.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });

  return NextResponse.json(plan);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await adminOnly(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();
  await Plan.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
