import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { Business } from "@/models/Business";

// POST /api/dashboard/subscription/cancel
// Body: { cancel: true | false }
// Sets cancelAutoRenew on the business — controls whether the cron will auto-charge via MIT.
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { cancel } = await req.json();
  if (typeof cancel !== "boolean") {
    return NextResponse.json({ error: "cancel (boolean) requerido" }, { status: 400 });
  }

  await connectDB();

  const business = await Business.findOneAndUpdate(
    { ownerId: user.userId },
    { cancelAutoRenew: cancel },
    { new: true, select: "cancelAutoRenew" },
  );

  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, cancelAutoRenew: business.cancelAutoRenew });
}
