import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Review } from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const jwtUser = await verifyToken(token);
    if (!jwtUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(jwtUser.userId)
      .select("name email avatar createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const reviews = await Review.find({ userId: jwtUser.userId })
      .populate("businessId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      user: JSON.parse(JSON.stringify(user)),
      reviews: JSON.parse(JSON.stringify(reviews)),
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const jwtUser = await verifyToken(token);
    if (!jwtUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { name, avatar } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    await connectDB();

    await User.findByIdAndUpdate(jwtUser.userId, {
      name: name.trim(),
      ...(avatar !== undefined && { avatar }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/users/me error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
