import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { User } from "@/models/User";
import { SubscriptionRequest } from "@/models/SubscriptionRequest";
import { Subscription } from "@/models/Subscription";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { sendSubscriptionApprovedEmail, sendSubscriptionRejectedEmail } from "@/lib/email";
import mongoose from "mongoose";

function adminOnly(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await adminOnly(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { action, featuredUntil, adminNote } = await req.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  await connectDB();

  const request = await SubscriptionRequest.findById(id).populate(
    "planId",
    "name price"
  );

  // Resolve plan name once — used for both the audit record and the email
  const rawPlanNameHoisted = (request?.planId as { name?: string | { es?: string; en?: string } })?.name;
  const planName =
    typeof rawPlanNameHoisted === "object"
      ? rawPlanNameHoisted?.es || rawPlanNameHoisted?.en || "Unknown Plan"
      : rawPlanNameHoisted ?? "Unknown Plan";

  if (!request) {
    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  }

  if (action === "approve") {
    if (!featuredUntil) {
      return NextResponse.json(
        { error: "featuredUntil is required for approval" },
        { status: 400 }
      );
    }

    const endDate = new Date(featuredUntil);
    const startDate = new Date();

    // Resolve planId — may be populated object or raw ObjectId
    const resolvedPlanId =
      request.planId instanceof mongoose.Types.ObjectId
        ? request.planId
        : (request.planId as { _id: mongoose.Types.ObjectId })?._id ??
          request.planId;

    const planPrice = (request.planId as { price?: number })?.price ?? 0;

    // Cancel any previously active subscriptions for this business
    await Subscription.updateMany(
      { businessId: request.businessId, status: "active" },
      { $set: { status: "cancelled" } }
    );

    // Create audit record
    await Subscription.create({
      businessId: request.businessId,
      planId: resolvedPlanId,
      planName,
      price: planPrice,
      startDate,
      endDate,
      status: "active",
      requestId: request._id,
      approvedByAdminId: new mongoose.Types.ObjectId(user.userId),
    });

    // Apply the plan to the business
    await Business.findByIdAndUpdate(request.businessId, {
      $set: {
        plan: "paid",
        planId: resolvedPlanId,
        featuredUntil: endDate,
      },
    });

    request.status = "approved";
  } else {
    request.status = "rejected";
    request.adminNote = adminNote?.trim() || "";
  }

  await request.save();

  // Fire-and-forget email to business owner
  try {
    const business = await Business.findById(request.businessId)
      .select("name slug ownerId")
      .populate("ownerId", "email locale")
      .lean() as { name: string; slug: string; ownerId: { email?: string; locale?: string } | null } | null;

    const ownerEmail = business?.ownerId?.email;
    if (ownerEmail) {
      const locale = business?.ownerId?.locale || "es";
      if (action === "approve") {
        sendSubscriptionApprovedEmail({
          to: ownerEmail,
          businessName: business!.name,
          planName,
          featuredUntil: new Date(featuredUntil),
          locale,
        }).catch(console.error);
      } else {
        sendSubscriptionRejectedEmail({
          to: ownerEmail,
          businessName: business!.name,
          planName,
          reason: adminNote?.trim() || undefined,
          locale,
        }).catch(console.error);
      }
    }
  } catch {
    // Non-critical — don't fail the response if email lookup fails
  }

  return NextResponse.json({ success: true });
}
