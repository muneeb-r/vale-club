import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { Business } from "@/models/Business";
import { Plan } from "@/models/Plan";
import { PendingRedsysPayment } from "@/models/PendingRedsysPayment";
import { redsys, randomTransactionId } from "@/lib/redsys";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { planId, billingCycle } = await req.json();
  if (!planId || !billingCycle) {
    return NextResponse.json({ error: "planId y billingCycle requeridos" }, { status: 400 });
  }

  await connectDB();

  const [business, plan] = await Promise.all([
    Business.findOne({ ownerId: user.userId }).select("_id status redsysIdentifier").lean(),
    Plan.findOne({ _id: planId, isActive: true }).lean(),
  ]);

  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });

  const priceEur = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  if (!priceEur || priceEur <= 0) {
    return NextResponse.json({ error: "Precio no válido" }, { status: 400 });
  }

  const orderId = randomTransactionId();
  const amountCents = Math.round(priceEur * 100);
  const BASE_URL = process.env.BASE_URL!;

  await PendingRedsysPayment.create({
    orderId,
    type: "plan",
    businessId: business._id,
    planId: plan._id,
    billingCycle,
    amount: amountCents,
    currency: "978",
  });

  const hasToken = !!business.redsysIdentifier;

  const form = redsys.createRedirectForm({
    DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE!,
    DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL!,
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_AMOUNT: String(amountCents),
    DS_MERCHANT_CURRENCY: "978",
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_URLOK: `${BASE_URL}/api/redsys/result?orderId=${orderId}&result=ok`,
    DS_MERCHANT_URLKO: `${BASE_URL}/api/redsys/result?orderId=${orderId}&result=ko`,
    DS_MERCHANT_MERCHANTURL: `${BASE_URL}/api/redsys/notify`,
    DS_MERCHANT_MERCHANTNAME: "VALE Club",
    DS_MERCHANT_CONSUMERLANGUAGE: "1",
    // COF: first payment stores the card token; subsequent payments send the stored token
    DS_MERCHANT_IDENTIFIER: hasToken ? business.redsysIdentifier! : "REQUIRED",
    DS_MERCHANT_COF_INI: hasToken ? "N" : "S",
    DS_MERCHANT_COF_TYPE: "R", // R = Recurring
  });

  return NextResponse.json({ url: form.url, params: form.body });
}
