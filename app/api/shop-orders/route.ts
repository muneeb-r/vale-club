import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopOrder } from "@/models/ShopOrder";
import { ShopService } from "@/models/ShopService";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, name, email, message } = body;

    if (!serviceId || !name || !email) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    await connectDB();

    const service = await ShopService.findById(serviceId).lean();
    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const type = (service as { priceType: string }).priceType === "quote" ? "quote" : "purchase";

    const order = await ShopOrder.create({
      serviceId,
      type,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message?.trim() ?? "",
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al enviar el pedido" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();
  const orders = await ShopOrder.find({})
    .populate("serviceId", "name priceType price")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
