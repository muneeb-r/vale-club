import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { Business } from "@/models/Business";
import { ratelimit, getClientIp } from "@/lib/ratelimit";

// 10 review submissions per hour per IP
const reviewLimiter = ratelimit({ limit: 10, windowMs: 60 * 60 * 1000 });

export async function POST(req: NextRequest) {
  if (!reviewLimiter(getClientIp(req))) {
    return NextResponse.json(
      { error: "Demasiadas reseñas. Espera un momento." },
      { status: 429 }
    );
  }
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "user") {
      return NextResponse.json(
        { error: "Solo clientes pueden dejar reseñas" },
        { status: 403 }
      );
    }

    const { businessId, rating, text, proofUrl } = await req.json();

    if (!businessId || !rating || !text || !proofUrl) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La puntuación debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    await connectDB();

    const business = await Business.findOne({
      _id: businessId,
      status: "active",
    });
    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const existing = await Review.findOne({
      userId: user.userId,
      businessId,
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya has dejado una reseña para este negocio" },
        { status: 409 }
      );
    }

    const review = await Review.create({
      businessId,
      userId: user.userId,
      rating,
      text: text.slice(0, 1000),
      proofUrl,
      proofStatus: "pending",
      isPublished: false,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
