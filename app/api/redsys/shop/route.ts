import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopService } from "@/models/ShopService";
import { PendingRedsysPayment } from "@/models/PendingRedsysPayment";
import { redsys, randomTransactionId } from "@/lib/redsys";

export async function POST(req: NextRequest) {
  const { serviceId, name, email, message } = await req.json();

  if (!serviceId || !name || !email) {
    return NextResponse.json({ error: "serviceId, name y email requeridos" }, { status: 400 });
  }

  await connectDB();

  const service = await ShopService.findOne({ _id: serviceId, isActive: true }).lean();
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

  if (service.priceType !== "fixed" || !service.price || service.price <= 0) {
    return NextResponse.json({ error: "Este servicio no admite pago con tarjeta" }, { status: 400 });
  }

  const priceEur = service.promoPrice ?? service.price;
  const orderId = randomTransactionId();
  const amountCents = Math.round(priceEur * 100);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

  await PendingRedsysPayment.create({
    orderId,
    type: "shop",
    serviceId: service._id,
    customerName: name.trim(),
    customerEmail: email.trim().toLowerCase(),
    customerMessage: message?.trim() ?? "",
    amount: amountCents,
    currency: "978",
  });

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
  });

  return NextResponse.json({ url: form.url, params: form.body });
}
