import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

async function adminOnly(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await adminOnly(req);
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await connectDB();
  // singleton — get or create
  let settings = await SiteSettings.findOne().lean();
  if (!settings) settings = await SiteSettings.create({});
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const user = await adminOnly(req);
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { bankDetails } = await req.json();
  await connectDB();

  let settings = await SiteSettings.findOne();
  if (!settings) settings = new SiteSettings({});
  if (bankDetails) settings.bankDetails = { ...settings.bankDetails, ...bankDetails };
  await settings.save();
  return NextResponse.json(settings);
}
