import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { Business } from "@/models/Business";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "business_owner") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { reply } = await req.json();

    if (!reply?.trim()) {
      return NextResponse.json(
        { error: "La respuesta no puede estar vacía" },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (!review.isPublished) {
      return NextResponse.json(
        { error: "No se puede responder a reseñas no publicadas" },
        { status: 400 }
      );
    }

    // Verify this business belongs to the authenticated owner
    const business = await Business.findOne({
      _id: review.businessId,
      ownerId: user.userId,
    });
    if (!business) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    review.businessReply = reply.slice(0, 1000);
    review.businessRepliedAt = new Date();
    await review.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/reviews/[id]/reply error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "business_owner") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { reply } = await req.json();

    if (!reply?.trim()) {
      return NextResponse.json(
        { error: "La respuesta no puede estar vacía" },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    const business = await Business.findOne({
      _id: review.businessId,
      ownerId: user.userId,
    });
    if (!business) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    review.businessReply = reply.slice(0, 1000);
    review.businessRepliedAt = new Date();
    await review.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/reviews/[id]/reply error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
