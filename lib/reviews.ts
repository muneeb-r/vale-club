import mongoose from "mongoose";
import { Review } from "@/models/Review";
import { Business } from "@/models/Business";

export async function recomputeBusinessRating(businessId: string) {
  const result = await Review.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        isPublished: true,
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avg = 0, count = 0 } = result[0] ?? {};
  await Business.findByIdAndUpdate(businessId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}
