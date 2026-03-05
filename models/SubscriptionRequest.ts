import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionRequest extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  paymentNote: string;     // business owner notes (payment method, reference, etc.)
  paymentProofUrl: string; // Firebase URL of uploaded transaction screenshot/receipt
  adminNote: string;       // admin reason for rejection
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    paymentNote: { type: String, default: "" },
    paymentProofUrl: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SubscriptionRequest =
  (mongoose.models.SubscriptionRequest as mongoose.Model<ISubscriptionRequest>) ||
  mongoose.model<ISubscriptionRequest>("SubscriptionRequest", SubscriptionRequestSchema);
