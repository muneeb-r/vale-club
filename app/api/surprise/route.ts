import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";

// Pick a random business from a sorted+limited candidate pool
async function pickRandom(filter: Record<string, unknown>, poolSize: number) {
  const candidates = await Business.find(filter)
    .select("slug")
    .sort({ rating: -1, reviewCount: -1 })
    .limit(poolSize)
    .lean();
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const geoFilter = hasCoords
    ? {
        "location.geoPoint": {
          $geoWithin: { $centerSphere: [[lng, lat], 25 / 6378.1] },
        },
      }
    : {};

  // 1. Try top 20 nearby (if coords provided)
  if (hasCoords) {
    const business = await pickRandom({ status: "active", ...geoFilter }, 20);
    if (business) return NextResponse.json({ slug: business.slug });
  }

  // 2. Fall back to top 30 globally
  const business = await pickRandom({ status: "active" }, 30);
  if (business) return NextResponse.json({ slug: business.slug });

  return NextResponse.json({ error: "No businesses found" }, { status: 404 });
}
