import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await connectDB();

  const business = await Business.findOne({
    slug,
    status: "active",
  })
    .populate("categories", "name nameEn nameCa slug icon")
    .lean();

  if (!business) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json(business);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();
  const business = await Business.findOne({ slug });

  if (!business) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  if (user.role !== "admin" && business.ownerId.toString() !== user.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Business owners cannot set sensitive fields
  if (user.role !== "admin") {
    delete body.status;
    delete body.plan;
    delete body.ownerId;
    delete body.featuredUntil;
  }

  const updated = await Business.findOneAndUpdate(
    { slug },
    { $set: body },
    { new: true, runValidators: true }
  ).populate("categories", "name nameEn nameCa slug icon");

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await connectDB();
  await Business.findOneAndDelete({ slug });
  return NextResponse.json({ success: true });
}
