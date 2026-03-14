import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { redsys, isResponseCodeOk } from "@/lib/redsys";
import { PendingRedsysPayment } from "@/models/PendingRedsysPayment";
import { Business } from "@/models/Business";
import { Plan } from "@/models/Plan";
import { Subscription } from "@/models/Subscription";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { ShopOrder } from "@/models/ShopOrder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    // Verify and decode Redsys notification
    const notification = redsys.processRestNotification(params as {
      Ds_SignatureVersion: string;
      Ds_MerchantParameters: string;
      Ds_Signature: string;
    });

    const orderId = notification.Ds_Order;
    const responseCode = notification.Ds_Response ?? "";
    const success = isResponseCodeOk(responseCode);
    // COF token — Redsys returns this when DS_MERCHANT_IDENTIFIER="REQUIRED" was sent
    // The type definition doesn't include it for notifications but it's present at runtime
    const notifExtra = notification as unknown as Record<string, string | undefined>;
    const cofIdentifier = notifExtra.Ds_Merchant_Identifier ?? null;
    // Ds_AuthorisationCode is the txn ID required as DS_MERCHANT_COF_TXNID in future MIT charges
    const cofTxnId = notification.Ds_AuthorisationCode ?? notifExtra.Ds_AuthorisationCode ?? null;

    await connectDB();

    const pending = await PendingRedsysPayment.findOne({ orderId });
    if (!pending) return new NextResponse("OK", { status: 200 });

    if (!success) {
      pending.status = "failed";
      await pending.save();
      return new NextResponse("OK", { status: 200 });
    }

    // Already processed guard
    if (pending.status === "paid") return new NextResponse("OK", { status: 200 });

    pending.status = "paid";
    await pending.save();

    if (pending.type === "plan") {
      const plan = await Plan.findById(pending.planId).lean();
      if (!plan || !pending.businessId) return new NextResponse("OK", { status: 200 });

      const billingCycle = pending.billingCycle ?? "monthly";
      const priceEur = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

      // For renewals: start from current featuredUntil if it's still in the future
      const business = await Business.findById(pending.businessId).select("featuredUntil").lean();
      const now = new Date();
      const currentEnd = business?.featuredUntil ? new Date(business.featuredUntil) : now;
      const startDate = currentEnd > now ? currentEnd : now;
      const endDate = new Date(startDate);
      if (billingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Expire any previously active subscription for this business
      await Subscription.updateMany(
        { businessId: pending.businessId, status: "active" },
        { status: "expired" },
      );

      // Create SubscriptionRequest record (card payment, auto-approved)
      const subRequest = await SubscriptionRequest.create({
        businessId: pending.businessId,
        planId: pending.planId,
        billingCycle,
        paymentMethod: "card",
        redsysOrderId: orderId,
        paymentProofUrl: "",
        status: "approved",
      });

      // Create Subscription audit record
      await Subscription.create({
        businessId: pending.businessId,
        planId: pending.planId,
        planName: plan.name.es,
        price: priceEur,
        billingCycle,
        startDate,
        endDate,
        status: "active",
        requestId: subRequest._id,
      });

      // Activate business plan + store COF token/txnId if returned, clear any failure flags
      await Business.findByIdAndUpdate(pending.businessId, {
        plan: "paid",
        planId: pending.planId,
        featuredUntil: endDate,
        mitFailedAt: null,
        cancelAutoRenew: false,
        ...(cofIdentifier ? { redsysIdentifier: cofIdentifier } : {}),
        ...(cofTxnId ? { redsysCofTxnId: cofTxnId } : {}),
      });
    } else if (pending.type === "shop") {
      await ShopOrder.create({
        serviceId: pending.serviceId,
        type: "purchase",
        name: pending.customerName,
        email: pending.customerEmail,
        message: pending.customerMessage ?? "",
        status: "new",
        paymentStatus: "paid",
        redsysOrderId: orderId,
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[redsys/notify]", err);
    // Always return 200 to Redsys even on error
    return new NextResponse("OK", { status: 200 });
  }
}
