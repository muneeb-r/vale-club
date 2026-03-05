import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { User } from "@/models/User";
import { Plan } from "@/models/Plan";
import { Subscription } from "@/models/Subscription";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { sendBusinessApprovedEmail, sendBusinessRejectedEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();
  const business = await Business.findById(id)
    .populate("ownerId", "name email")
    .populate("categories", "name nameEn icon")
    .populate("planId", "name price features")
    .lean();

  if (!business) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json(business);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();

  const prev = await Business.findById(id).select("status").lean();
  const updated = await Business.findByIdAndUpdate(id, { $set: body }, { new: true })
    .populate("ownerId", "name email");

  if (!updated) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  // Sync Subscription record when plan is assigned/updated from admin
  if ("plan" in body && "featuredUntil" in body) {
    if (body.plan === "paid" && body.planId && body.featuredUntil) {
      const plan = await Plan.findById(body.planId).lean() as { _id: mongoose.Types.ObjectId; name: { es: string; en: string } | string; price: number } | null;
      const planName = plan
        ? (typeof plan.name === "string" ? plan.name : plan.name.es || plan.name.en)
        : "Pro";
      const startDate = new Date();
      const endDate = new Date(body.featuredUntil);

      // Mark any previous active subscriptions as cancelled
      await Subscription.updateMany(
        { businessId: updated._id, status: "active" },
        { $set: { status: "cancelled" } }
      );

      await Subscription.create({
        businessId: updated._id,
        planId: body.planId,
        planName,
        price: plan?.price ?? 0,
        startDate,
        endDate,
        status: "active",
        approvedByAdminId: user.userId,
      });
    } else if (body.plan === "free") {
      // Downgraded to free — cancel active subscriptions
      await Subscription.updateMany(
        { businessId: updated._id, status: "active" },
        { $set: { status: "cancelled" } }
      );
    }
  }

  // Send email when status changes to active (approved) or blocked (rejected)
  const newStatus = body.status;
  const prevStatus = prev?.status;
  if (newStatus && newStatus !== prevStatus) {
    const owner = updated.ownerId as { email?: string } | null;
    const ownerEmail = owner?.email;
    if (ownerEmail) {
      const ownerDoc = await User.findOne({ email: ownerEmail }).select("locale").lean();
      const locale = (ownerDoc as { locale?: string } | null)?.locale || "es";
      if (newStatus === "active") {
        sendBusinessApprovedEmail({
          to: ownerEmail,
          businessName: updated.name,
          slug: updated.slug,
          locale,
        }).catch(console.error);
      } else if (newStatus === "rejected") {
        sendBusinessRejectedEmail({
          to: ownerEmail,
          businessName: updated.name,
          reason: body.adminNote || undefined,
          locale,
        }).catch(console.error);
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();
  await Business.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
