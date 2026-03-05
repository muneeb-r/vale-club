import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user || user.role !== "user") {
    return NextResponse.json({ error: "Solo clientes pueden editar reseñas" }, { status: 403 });
  }

  await connectDB();

  const review = await Review.findById(id);
  if (!review) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });

  if (review.userId.toString() !== user.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { rating, text, proofUrl } = await req.json();

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Puntuación entre 1 y 5" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (rating !== undefined) update.rating = rating;
  if (text !== undefined) update.text = text.slice(0, 1000);

  // If proof changes, reset status back to pending review
  if (proofUrl !== undefined && proofUrl !== review.proofUrl) {
    update.proofUrl = proofUrl;
    update.proofStatus = "pending";
    update.isPublished = false;
  }

  const updated = await Review.findByIdAndUpdate(id, { $set: update }, { new: true });
  return NextResponse.json({ review: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await connectDB();

  const review = await Review.findById(id);
  if (!review) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });

  // Only the review author or admin can delete
  if (user.role !== "admin" && review.userId.toString() !== user.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await Review.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
