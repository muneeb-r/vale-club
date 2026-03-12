import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopService } from "@/models/ShopService";
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
  const services = await ShopService.find({}).sort({ category: 1, order: 1 }).lean();
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const body = await req.json();
    await connectDB();
    const service = await ShopService.create(body);
    return NextResponse.json(service, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 });
  }
}
