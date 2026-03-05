import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { User } from "@/models/User";
import { sendBusinessInReviewEmail } from "@/lib/email";

// Business owner submits their profile for admin review
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "business_owner") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    await connectDB();

    const business = await Business.findOne({ ownerId: user.userId });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Only allow submission from "pending" or "rejected" status
    if (business.status !== "pending" && business.status !== "rejected") {
      return NextResponse.json(
        { error: "El perfil ya fue enviado para revisión" },
        { status: 409 }
      );
    }

    business.status = "inreview";
    await business.save();

    // Fire-and-forget confirmation email to owner
    try {
      const owner = await User.findById(user.userId).select("email locale").lean() as { email?: string; locale?: string } | null;
      if (owner?.email) {
        sendBusinessInReviewEmail({
          to: owner.email,
          businessName: business.name,
          locale: owner.locale || "es",
        }).catch(console.error);
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/dashboard/business/submit error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
