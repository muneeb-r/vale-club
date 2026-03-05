import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { recomputeBusinessRating } from "@/lib/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { action, note } = await req.json();

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      review.proofStatus = "approved";
      review.isPublished = true;
      await review.save();
      await recomputeBusinessRating(review.businessId.toString());
    } else {
      review.proofStatus = "rejected";
      review.proofNote = note || "";
      review.isPublished = false;
      await review.save();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/proofs/[id] error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
