import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Review } from "@/models/Review";
import { BusinessReview } from "@/models/BusinessReview";

// POST /api/business-reviews
// Business owner leaves a review on a customer.
// Requires: business_owner role, customer must have a published review for this business.
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { userId, rating, text } = body ?? {};

  if (!userId || !rating || !text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  if (text.trim().length > 1000) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  await connectDB();

  // Verify the requester owns a business
  const business = await Business.findOne({ ownerId: user.userId }).select("_id");
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  // Verify the customer has a published (approved) review for this business
  const customerReview = await Review.findOne({
    businessId: business._id,
    userId,
    isPublished: true,
  });
  if (!customerReview) {
    return NextResponse.json(
      { error: "Customer has no published review for your business" },
      { status: 403 }
    );
  }

  // Check if business already reviewed this customer
  const existing = await BusinessReview.findOne({
    businessId: business._id,
    userId,
  });
  if (existing) {
    return NextResponse.json({ error: "Already reviewed this customer" }, { status: 409 });
  }

  const review = await BusinessReview.create({
    businessId: business._id,
    userId,
    rating,
    text: text.trim(),
    isPublished: true,
  });

  return NextResponse.json({ review }, { status: 201 });
}

// PUT /api/business-reviews
// Business owner edits their existing review on a customer.
export async function PUT(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "business_owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { userId, rating, text } = body ?? {};

  if (!userId || !rating || !text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  if (text.trim().length > 1000) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  await connectDB();

  const business = await Business.findOne({ ownerId: user.userId }).select("_id");
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const existing = await BusinessReview.findOne({ businessId: business._id, userId });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  existing.rating = rating;
  existing.text = text.trim();
  await existing.save();

  return NextResponse.json({ review: existing });
}
