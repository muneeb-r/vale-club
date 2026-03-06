import mongoose, { Schema, Document } from "mongoose";
import "./Business";
import "./User";

/**
 * BusinessReview — a review left BY a business ON a customer.
 * This is the "business → user" direction of the bidirectional review system.
 *
 * A business can only review a customer if that customer has a published review
 * for the business (i.e. the service was confirmed to have happened).
 */
export interface IBusinessReview extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId; // the business leaving the review
  userId: mongoose.Types.ObjectId; // the customer being reviewed
  rating: number; // 1–5
  text: string; // max 1000
  isPublished: boolean; // always true on creation (no proof needed — business already verified via customer's proof)
  createdAt: Date;
  updatedAt: Date;
}

const BusinessReviewSchema = new Schema<IBusinessReview>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 1000 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One review per business-user pair
BusinessReviewSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export const BusinessReview =
  (mongoose.models.BusinessReview as mongoose.Model<IBusinessReview>) ||
  mongoose.model<IBusinessReview>("BusinessReview", BusinessReviewSchema);
