import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Plan } from "@/models/Plan";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { planId, billingCycle, paymentNote, paymentProofUrl } = await req.json();

  if (!planId) {
    return NextResponse.json({ error: "Plan requerido" }, { status: 400 });
  }
  if (!["monthly", "yearly"].includes(billingCycle)) {
    return NextResponse.json({ error: "Ciclo de facturación inválido" }, { status: 400 });
  }

  await connectDB();

  const [business, plan] = await Promise.all([
    Business.findOne({ ownerId: user.userId }).lean(),
    Plan.findById(planId).lean(),
  ]);

  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (business.status !== "active") return NextResponse.json({ error: "El negocio debe estar activo para solicitar un plan" }, { status: 403 });
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });

  // Cancel any existing pending request for this business
  await SubscriptionRequest.deleteMany({ businessId: business._id, status: "pending" });

  const request = await SubscriptionRequest.create({
    businessId: business._id,
    planId,
    billingCycle: billingCycle as "monthly" | "yearly",
    paymentNote: paymentNote?.trim() || "",
    paymentProofUrl: paymentProofUrl?.trim() || "",
    status: "pending",
  });

  return NextResponse.json(request, { status: 201 });
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();

  const business = await Business.findOne({ ownerId: user.userId }).select("_id").lean();
  if (!business) return NextResponse.json([]);

  const requests = await SubscriptionRequest.find({ businessId: business._id })
    .populate("planId", "name price")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(requests)));
}
