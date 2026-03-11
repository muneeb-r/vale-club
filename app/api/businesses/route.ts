import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseInt(searchParams.get("radius") || "0");
  const minRating = parseFloat(searchParams.get("minRating") || "0");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") || "12"));

  await connectDB();

  const filter: Record<string, unknown> = { status: "active" };

  if (category) filter.categories = category;

  if (radius > 0 && !isNaN(lat) && !isNaN(lng)) {
    filter["location.geoPoint"] = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6378.1],
      },
    };
  } else if (city) {
    filter["location.city"] = new RegExp(city, "i");
  }

  if (minRating > 0) filter.rating = { $gte: minRating };
  if (q) filter.$text = { $search: q };

  const projection = q ? { score: { $meta: "textScore" } } : undefined;
  const sortOptions = q
    ? ({ score: { $meta: "textScore" } } as Record<string, { $meta: string }>)
    : ({ rating: -1, reviewCount: -1, createdAt: -1 } as Record<string, -1>);

  const [businesses, total] = await Promise.all([
    Business.find(filter, projection)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categories", "name nameEn nameCa slug icon")
      .lean(),
    Business.countDocuments(filter),
  ]);

  return NextResponse.json({
    businesses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
    },
  });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const business = await Business.create(body);
    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 });
  }
}
