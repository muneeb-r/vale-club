import mongoose, { Schema, Document } from "mongoose";
import "./User";

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  proofUrl: string;
  proofStatus: "pending" | "approved" | "rejected";
  proofNote?: string;
  isPublished: boolean;
  businessReply?: string;
  businessRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
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
    proofUrl: { type: String, required: true },
    proofStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    proofNote: { type: String },
    isPublished: { type: Boolean, default: false },
    businessReply: { type: String, maxlength: 1000 },
    businessRepliedAt: { type: Date },
  },
  { timestamps: true },
);

// Compound indexes
ReviewSchema.index({ businessId: 1, isPublished: 1 });
ReviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });

export const Review =
  (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema);
