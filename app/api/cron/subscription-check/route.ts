import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Subscription } from "@/models/Subscription";
import { sendRenewalWarningEmail, sendPlanExpiredEmail } from "@/lib/email";

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
  const in7Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const results = {
    warningsSent: 0,
    expired: 0,
    errors: [] as string[],
  };

  // ── 1. Send 7-day renewal warning ────────────────────────────────────────
  // Find active subscriptions ending within the next 7 days
  // where we haven't already sent a warning in this window.
  const expiringSoon = await Subscription.find({
    status: "active",
    endDate: { $gte: now, $lte: in7Days },
    $or: [
      { renewalWarningSentAt: { $exists: false } },
      // Don't re-send if we already warned within the past 6 days
      {
        renewalWarningSentAt: {
          $lt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        },
      },
    ],
  }).populate({
    path: "businessId",
    select: "name ownerId",
    populate: { path: "ownerId", select: "email name" },
  });

  for (const sub of expiringSoon) {
    try {
      const business = sub.businessId as unknown as {
        name: string;
        ownerId: { email: string; name: string };
      };

      if (!business?.ownerId?.email) continue;

      await sendRenewalWarningEmail({
        to: business.ownerId.email,
        businessName: business.name,
        planName: sub.planName,
        expiryDate: sub.endDate,
        locale: "es", // default to Spanish; owner locale not stored yet
      });

      sub.renewalWarningSentAt = now;
      await sub.save();
      results.warningsSent++;
    } catch (err) {
      results.errors.push(`Warning email failed for sub ${sub._id}: ${err}`);
    }
  }

  // ── 2. Expire overdue subscriptions ──────────────────────────────────────
  // Find active subscriptions whose end date has already passed.
  const overdue = await Subscription.find({
    status: "active",
    endDate: { $lt: now },
  }).populate({
    path: "businessId",
    select: "name ownerId plan",
    populate: { path: "ownerId", select: "email name" },
  });

  for (const sub of overdue) {
    try {
      const business = sub.businessId as unknown as {
        _id: string;
        name: string;
        plan: string;
        ownerId: { email: string; name: string };
      };

      // Mark subscription as expired
      sub.status = "expired";
      await sub.save();

      // Downgrade business to free plan
      if (business?.plan === "paid") {
        await Business.findByIdAndUpdate(business._id, {
          $set: {
            plan: "free",
            planId: null,
            featuredUntil: null,
          },
        });
      }

      // Notify owner
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
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...results,
  });
}
