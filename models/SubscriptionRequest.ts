import mongoose, { Schema, Document } from "mongoose";
import "./Business";
import "./Plan";

export interface ISubscriptionRequest extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  billingCycle: "monthly" | "yearly";
  paymentNote: string;
  paymentProofUrl: string;
  adminNote: string;
  paymentMethod?: "bank_transfer" | "card";
  redsysOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    paymentNote: { type: String, default: "" },
    paymentProofUrl: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["bank_transfer", "card"] },
    redsysOrderId: { type: String },
  },
  { timestamps: true },
);

export const SubscriptionRequest =
  (mongoose.models
    .SubscriptionRequest as mongoose.Model<ISubscriptionRequest>) ||
  mongoose.model<ISubscriptionRequest>(
    "SubscriptionRequest",
    SubscriptionRequestSchema,
  );
