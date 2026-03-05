import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Any authenticated user can fetch bank details (to show in subscription form)
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await connectDB();
  const settings = await SiteSettings.findOne().select("bankDetails").lean();
  return NextResponse.json({ bankDetails: settings?.bankDetails ?? {} });
}
