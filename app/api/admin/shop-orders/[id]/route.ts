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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    await connectDB();
    const order = await ShopOrder.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true },
    ).populate("serviceId", "name priceType price");
    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  await connectDB();
  await ShopOrder.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
