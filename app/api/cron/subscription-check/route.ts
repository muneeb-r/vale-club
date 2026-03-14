import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Plan } from "@/models/Plan";
import { Subscription } from "@/models/Subscription";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { PendingRedsysPayment } from "@/models/PendingRedsysPayment";
import { sendRenewalWarningEmail, sendPlanExpiredEmail } from "@/lib/email";
import { redsys, randomTransactionId, isResponseCodeOk } from "@/lib/redsys";

// Vercel calls this endpoint daily (see vercel.json).
// Secured by CRON_SECRET env var — set the same value in Vercel project settings.
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const results = {
    autoRenewed: 0,
    warningsSent: 0,
    expired: 0,
    errors: [] as string[],
  };

  // ── 1. Auto-renew via MIT for businesses with a stored COF token ──────────
  // Find active subscriptions ending within the next 3 days where the business
  // has a Redsys COF identifier stored (card tokenized on first payment).
  const mitCandidates = await Subscription.find({
    status: "active",
    endDate: { $gte: now, $lte: in3Days },
  }).populate({
    path: "businessId",
    select:
      "name ownerId redsysIdentifier redsysCofTxnId cancelAutoRenew featuredUntil planId",
    populate: { path: "ownerId", select: "email name" },
  });

  await Promise.all(
    mitCandidates.map(async (sub) => {
      try {
        const business = sub.businessId as unknown as {
          _id: string;
          name: string;
          redsysIdentifier?: string;
          redsysCofTxnId?: string;
          cancelAutoRenew?: boolean;
          featuredUntil?: Date;
          planId?: string;
          ownerId: { email: string; name: string };
        };

        if (!business?.redsysIdentifier) return; // no token — will fall through to warning email
        if (!business?.redsysCofTxnId) return; // no original txn ID — COF registration incomplete
        if (business.cancelAutoRenew) return; // user opted out of auto-renewal

        const plan = await Plan.findById(sub.planId).lean();
        if (!plan) return;

        const billingCycle = sub.billingCycle;
        const priceEur =
          billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
        if (!priceEur || priceEur <= 0) return;

        const orderId = randomTransactionId();
        const amountCents = Math.round(priceEur * 100);

        await PendingRedsysPayment.create({
          orderId,
          type: "plan",
          businessId: business._id,
          planId: plan._id,
          billingCycle,
          amount: amountCents,
          currency: "978",
        });

        // MIT: merchant-initiated transaction using stored COF token (no redirect needed)
        const response = await redsys.restTrataPeticion({
          DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE!,
          DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL!,
          DS_MERCHANT_ORDER: orderId,
          DS_MERCHANT_AMOUNT: String(amountCents),
          DS_MERCHANT_CURRENCY: "978",
          DS_MERCHANT_TRANSACTIONTYPE: "0",
          DS_MERCHANT_IDENTIFIER: business.redsysIdentifier,
          DS_MERCHANT_COF_INI: "N",
          DS_MERCHANT_COF_TYPE: "R",
          DS_MERCHANT_COF_TXNID: business.redsysCofTxnId ?? "",
          // SCA exemption for MIT recurring — no DIRECTPAYMENT to avoid SIS0463
          DS_MERCHANT_EXCEP_SCA: "MIT",
        });

        const responseCode = response.Ds_Response ?? "";
        if (!isResponseCodeOk(responseCode)) {
          // MIT failed — mark pending as failed, record failure on business so UI shows update-card CTA
          await PendingRedsysPayment.updateOne(
            { orderId },
            { status: "failed" },
          );
          await Business.findByIdAndUpdate(business._id, { mitFailedAt: now });
          results.errors.push(
            `MIT failed for sub ${sub._id}: code ${responseCode} ${JSON.stringify(
              {
                DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE!,
                DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL!,
                DS_MERCHANT_ORDER: orderId,
                DS_MERCHANT_AMOUNT: String(amountCents),
                DS_MERCHANT_CURRENCY: "978",
                DS_MERCHANT_TRANSACTIONTYPE: "0",
                DS_MERCHANT_IDENTIFIER: business.redsysIdentifier,
                DS_MERCHANT_COF_INI: "N",
                DS_MERCHANT_COF_TYPE: "R",
                DS_MERCHANT_COF_TXNID: business.redsysCofTxnId ?? "",
                // SCA exemption for MIT recurring — no DIRECTPAYMENT to avoid SIS0463
                DS_MERCHANT_EXCEP_SCA: "MIT",
              },
            )}`,
          );
          return;
        }

        // MIT succeeded — activate renewal (same logic as notify route)
        const currentEnd = business.featuredUntil
          ? new Date(business.featuredUntil)
          : now;
        const startDate = currentEnd > now ? currentEnd : now;
        const endDate = new Date(startDate);
        if (billingCycle === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        await PendingRedsysPayment.updateOne({ orderId }, { status: "paid" });

        await Subscription.updateMany(
          { businessId: business._id, status: "active" },
          { status: "expired" },
        );

        const subRequest = await SubscriptionRequest.create({
          businessId: business._id,
          planId: plan._id,
          billingCycle,
          paymentMethod: "card",
          redsysOrderId: orderId,
          paymentProofUrl: "",
          status: "approved",
        });

        await Subscription.create({
          businessId: business._id,
          planId: plan._id,
          planName: plan.name.es,
          price: priceEur,
          billingCycle,
          startDate,
          endDate,
          status: "active",
          requestId: subRequest._id,
        });

        await Business.findByIdAndUpdate(business._id, {
          plan: "paid",
          planId: plan._id,
          featuredUntil: endDate,
          mitFailedAt: null,
          cancelAutoRenew: false,
        });

        results.autoRenewed++;
      } catch (err) {
        results.errors.push(`MIT renewal failed for sub ${sub._id}: ${err}`);
      }
    }),
  );

  // ── 2. Send 7-day renewal warning (for businesses without COF token) ──────
  const expiringSoon = await Subscription.find({
    status: "active",
    endDate: { $gte: now, $lte: in7Days },
    $or: [
      { renewalWarningSentAt: { $exists: false } },
      {
        renewalWarningSentAt: {
          $lt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        },
      },
    ],
  }).populate({
    path: "businessId",
    select: "name ownerId redsysIdentifier",
    populate: { path: "ownerId", select: "email name" },
  });

  await Promise.all(
    expiringSoon.map(async (sub) => {
      try {
        const business = sub.businessId as unknown as {
          name: string;
          redsysIdentifier?: string;
          ownerId: { email: string; name: string };
        };

        // Skip warning if this business has a token (auto-renewal handles it)
        if (business?.redsysIdentifier) return;
        if (!business?.ownerId?.email) return;

        await sendRenewalWarningEmail({
          to: business.ownerId.email,
          businessName: business.name,
          planName: sub.planName,
          expiryDate: sub.endDate,
          locale: "es",
        });

        sub.renewalWarningSentAt = now;
        await sub.save();
        results.warningsSent++;
      } catch (err) {
        results.errors.push(`Warning email failed for sub ${sub._id}: ${err}`);
      }
    }),
  );

  // ── 3. Expire overdue subscriptions ──────────────────────────────────────
  const grace = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const overdue = await Subscription.find({
    status: "active",
    endDate: { $lt: grace },
  }).populate({
    path: "businessId",
    select: "name ownerId plan",
    populate: { path: "ownerId", select: "email name" },
  });

  await Promise.all(
    overdue.map(async (sub) => {
      try {
        const business = sub.businessId as unknown as {
          _id: string;
          name: string;
          plan: string;
          ownerId: { email: string; name: string };
        };

        sub.status = "expired";
        await sub.save();

        if (business?.plan === "paid") {
          await Business.findByIdAndUpdate(business._id, {
            $set: { plan: "free", planId: null, featuredUntil: null },
          });
        }

        if (business?.ownerId?.email) {
          await sendPlanExpiredEmail({
            to: business.ownerId.email,
            businessName: business.name,
            planName: sub.planName,
            locale: "es",
          });
        }

        results.expired++;
      } catch (err) {
        results.errors.push(`Expiry failed for sub ${sub._id}: ${err}`);
      }
    }),
  );

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...results,
  });
}
