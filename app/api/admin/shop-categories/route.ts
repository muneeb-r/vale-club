import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopCategory } from "@/models/ShopCategory";
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
  const cats = await ShopCategory.find({}).sort({ order: 1 }).lean();
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const body = await req.json();
    await connectDB();
    const cat = await ShopCategory.create(body);
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
