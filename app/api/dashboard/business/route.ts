import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { slugify } from "@/lib/utils";

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

    // Only one business per owner
    const existing = await Business.findOne({ ownerId: user.userId });
    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes un negocio registrado" },
        { status: 409 }
      );
    }

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    let slug = slugify(name.trim());
    const existingSlug = await Business.findOne({ slug });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const business = await Business.create({
      name: name.trim(),
      slug,
      ownerId: user.userId,
      status: "pending",
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("POST /api/dashboard/business error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
